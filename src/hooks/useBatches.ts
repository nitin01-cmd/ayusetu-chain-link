import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Batch {
  id: string;
  batch_id: string;
  type: 'raw_material' | 'lot' | 'processed' | 'final_product';
  status: string;
  current_owner_id: string;
  farmer_id?: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_location?: string;
  product_name: string;
  quantity?: number;
  unit?: string;
  source_location?: string;
  destination_location?: string;
  qr_code_data?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface BatchHistory {
  id: string;
  batch_id: string;
  event_type: string;
  timestamp: string;
  actor_id: string;
  details: any;
  documents?: string[];
}

export function useBatches(userRole?: string, userId?: string) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !userRole) return;

    fetchBatches();
    subscribeToUpdates();
  }, [userId, userRole]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('batches').select('*');

      // Apply role-based filters
      switch (userRole) {
        case 'aggregator':
          query = query.in('type', ['raw_material', 'lot']);
          break;
        case 'processor':
          query = query.or('status.in.(in_transit,received),current_owner_id.eq.' + userId);
          break;
        case 'manufacturer':
          query = query.or('type.in.(processed,final_product),current_owner_id.eq.' + userId);
          break;
        case 'distributor':
          query = query.or('status.eq.finalized,current_owner_id.eq.' + userId);
          break;
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('batch-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches'
        },
        () => {
          fetchBatches(); // Refetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getBatchHistory = async (batchId: string): Promise<BatchHistory[]> => {
    const { data: batch } = await supabase
      .from('batches')
      .select('id')
      .eq('batch_id', batchId)
      .single();

    if (!batch) return [];

    const { data, error } = await supabase
      .from('batch_history')
      .select('*')
      .eq('batch_id', batch.id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const updateBatchStatus = async (batchId: string, newStatus: string, details?: any) => {
    const { error } = await supabase
      .from('batches')
      .update({ 
        status: newStatus as any,
        updated_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);

    if (error) throw error;

    // Add custom history entry if details provided
    if (details) {
      const { data: batch } = await supabase
        .from('batches')
        .select('id')
        .eq('batch_id', batchId)
        .single();

      if (batch) {
        await supabase
          .from('batch_history')
          .insert({
            batch_id: batch.id,
            event_type: 'CustodyTransfer',
            actor_id: userId,
            details
          });
      }
    }
  };

  const transferBatch = async (batchId: string, newOwnerId: string, destination?: string) => {
    const { error } = await supabase
      .from('batches')
      .update({ 
        current_owner_id: newOwnerId,
        status: 'in_transit',
        destination_location: destination,
        updated_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);

    if (error) throw error;
  };

  const createLot = async (lotId: string, constituentBatchIds: string[], productName: string, quantity: number, unit: string) => {
    // Call cascade function
    const { error } = await supabase.functions.invoke('batch-cascade', {
      body: {
        action: 'createLot',
        batchId: lotId,
        details: {
          constituentBatchIds,
          newOwnerId: userId,
          productName,
          quantity,
          unit
        }
      }
    });

    if (error) throw error;
  };

  const processLot = async (processedBatchId: string, parentLotId: string, processType: string, outputQuantity: number, outputUnit: string) => {
    const { error } = await supabase.functions.invoke('batch-cascade', {
      body: {
        action: 'processLot',
        batchId: processedBatchId,
        details: {
          parentLotId,
          newOwnerId: userId,
          processType,
          outputQuantity,
          outputUnit
        }
      }
    });

    if (error) throw error;
  };

  const formulateProduct = async (finalProductId: string, inputBatchIds: string[], productName: string, finalQuantity: number, finalUnit: string) => {
    const { error } = await supabase.functions.invoke('batch-cascade', {
      body: {
        action: 'formulateProduct',
        batchId: finalProductId,
        details: {
          inputBatchIds,
          newOwnerId: userId,
          productName,
          finalQuantity,
          finalUnit
        }
      }
    });

    if (error) throw error;
  };

  const recallBatch = async (batchId: string, reason: string) => {
    const { error } = await supabase.functions.invoke('batch-cascade', {
      body: {
        action: 'recall',
        batchId: batchId,
        details: {
          reason,
          actorId: userId
        }
      }
    });

    if (error) throw error;
  };

  return {
    batches,
    loading,
    error,
    getBatchHistory,
    updateBatchStatus,
    transferBatch,
    createLot,
    processLot,
    formulateProduct,
    recallBatch,
    refetch: fetchBatches
  };
}