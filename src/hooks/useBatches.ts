import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Batch {
  id: string;
  batch_id: string;
  type: 'raw_material' | 'lot' | 'processed' | 'final_product';
  status: 'created' | 'in_transit' | 'received' | 'processing' | 'finalized' | 'dispatched' | 'recalled';
  current_owner_id: string;
  quantity: number;
  product_name: string;
  farmer_name?: string;
  farmer_phone?: string;
  farmer_location?: string;
  source_location?: string;
  destination_location?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface BatchHistory {
  id: string;
  batch_id: string;
  event_type: string;
  actor_id: string;
  details: Record<string, any>;
  created_at: string;
}

export const useBatches = (userRole: string, userId: string) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBatches = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batch data",
        variant: "destructive"
      });
    }
  };

  const fetchBatchHistory = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('batch_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatchHistory(data || []);
    } catch (error) {
      console.error('Error fetching batch history:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchBatches(), fetchBatchHistory()]);
      setLoading(false);
    };

    initializeData();

    // Set up real-time subscriptions
    const batchesChannel = supabase
      .channel('batches_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches'
        },
        (payload) => {
          console.log('Batches change received:', payload);
          fetchBatches(); // Refetch to ensure we have latest data
        }
      )
      .subscribe();

    const historyChannel = supabase
      .channel('batch_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_history'
        },
        (payload) => {
          console.log('Batch history change received:', payload);
          fetchBatchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(batchesChannel);
      supabase.removeChannel(historyChannel);
    };
  }, []);

  const createBatch = async (batchData: Partial<Batch>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('batches')
        .insert({
          ...batchData,
          current_owner_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch created successfully",
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateBatch = async (batchId: string, updates: Partial<Batch>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('batches')
        .update(updates)
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch updated successfully",
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: "Error",
        description: "Failed to update batch",
        variant: "destructive"
      });
      throw error;
    }
  };

  const transferBatch = async (batchId: string, newOwnerId: string, newStatus?: string) => {
    try {
      const updates: any = { current_owner_id: newOwnerId };
      if (newStatus) {
        updates.status = newStatus;
      }

      const { data, error } = await (supabase as any)
        .from('batches')
        .update(updates)
        .eq('id', batchId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Batch transferred successfully",
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error transferring batch:', error);
      toast({
        title: "Error",
        description: "Failed to transfer batch",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Filter batches based on user role
  const getFilteredBatches = () => {
    if (!batches.length) return [];

    switch (userRole) {
      case 'aggregator':
        return batches.filter(batch => 
          batch.type === 'raw_material' || 
          (batch.type === 'lot' && batch.current_owner_id === userId)
        );
      
      case 'processor':
        return batches.filter(batch => 
          batch.status === 'in_transit' || 
          batch.status === 'received' || 
          batch.current_owner_id === userId
        );
      
      case 'manufacturer':
        return batches.filter(batch => 
          batch.type === 'processed' || 
          batch.type === 'final_product' || 
          batch.current_owner_id === userId
        );
      
      case 'distributor':
        return batches.filter(batch => 
          batch.status === 'finalized' || 
          batch.current_owner_id === userId
        );
      
      default:
        return [];
    }
  };

  return {
    batches: getFilteredBatches(),
    batchHistory,
    loading,
    createBatch,
    updateBatch,
    transferBatch,
    refetch: () => {
      fetchBatches();
      fetchBatchHistory();
    }
  };
};