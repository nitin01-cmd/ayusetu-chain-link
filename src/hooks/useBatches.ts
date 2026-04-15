import { useState, useEffect } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';
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

const batchesCollection = collection(firestore, 'batches');
const batchHistoryCollection = collection(firestore, 'batch_history');

const toBatch = (snapshot: QueryDocumentSnapshot<DocumentData>): Batch => {
  const data = snapshot.data() as Partial<Batch>;

  return {
    id: snapshot.id,
    batch_id: data.batch_id || snapshot.id,
    type: data.type || 'raw_material',
    status: data.status || 'created',
    current_owner_id: data.current_owner_id || '',
    quantity: data.quantity || 0,
    product_name: data.product_name || '',
    farmer_name: data.farmer_name,
    farmer_phone: data.farmer_phone,
    farmer_location: data.farmer_location,
    source_location: data.source_location,
    destination_location: data.destination_location,
    metadata: data.metadata || {},
    created_at: data.created_at || '',
    updated_at: data.updated_at || data.created_at || '',
  };
};

const toBatchHistory = (snapshot: QueryDocumentSnapshot<DocumentData>): BatchHistory => {
  const data = snapshot.data() as Partial<BatchHistory>;

  return {
    id: snapshot.id,
    batch_id: data.batch_id || snapshot.id,
    event_type: data.event_type || 'unknown',
    actor_id: data.actor_id || '',
    details: data.details || {},
    created_at: data.created_at || '',
  };
};

export const useBatches = (userRole: string, userId: string) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchHistory, setBatchHistory] = useState<BatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const reloadData = async () => {
    const batchesQuery = query(batchesCollection, orderBy('created_at', 'desc'));
    const historyQuery = query(batchHistoryCollection, orderBy('created_at', 'desc'));

    try {
      const [batchSnapshot, historySnapshot] = await Promise.all([
        getDocs(batchesQuery),
        getDocs(historyQuery),
      ]);

      setBatches(batchSnapshot.docs.map(toBatch));
      setBatchHistory(historySnapshot.docs.map(toBatchHistory));
    } catch (error) {
      console.error('Error fetching initial batch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batch data',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const batchesQuery = query(batchesCollection, orderBy('created_at', 'desc'));
    const historyQuery = query(batchHistoryCollection, orderBy('created_at', 'desc'));

    const unsubscribeBatches = onSnapshot(
      batchesQuery,
      (snapshot) => {
        if (isMounted) {
          setBatches(snapshot.docs.map(toBatch));
        }
      },
      (error) => {
        console.error('Error fetching batches:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch batch data',
          variant: 'destructive',
        });
      }
    );

    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        if (isMounted) {
          setBatchHistory(snapshot.docs.map(toBatchHistory));
        }
      },
      (error) => {
        console.error('Error fetching batch history:', error);
      }
    );

    void reloadData().finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeBatches();
      unsubscribeHistory();
    };
  }, []);

  const appendHistory = async (eventType: string, batchId: string, details: Record<string, any>) => {
    await addDoc(batchHistoryCollection, {
      batch_id: batchId,
      event_type: eventType,
      actor_id: userId,
      details,
      created_at: new Date().toISOString(),
    });
  };

  const createBatch = async (batchData: Partial<Batch>) => {
    try {
      const now = new Date().toISOString();
      const batchRef = await addDoc(batchesCollection, {
        ...batchData,
        current_owner_id: userId,
        created_at: batchData.created_at || now,
        updated_at: now,
      });

      const createdBatch: Batch = {
        id: batchRef.id,
        batch_id: batchData.batch_id || batchRef.id,
        type: batchData.type || 'raw_material',
        status: batchData.status || 'created',
        current_owner_id: userId,
        quantity: batchData.quantity || 0,
        product_name: batchData.product_name || '',
        farmer_name: batchData.farmer_name,
        farmer_phone: batchData.farmer_phone,
        farmer_location: batchData.farmer_location,
        source_location: batchData.source_location,
        destination_location: batchData.destination_location,
        metadata: batchData.metadata || {},
        created_at: batchData.created_at || now,
        updated_at: now,
      };

      await appendHistory('created', createdBatch.batch_id, {
        batch: createdBatch,
      });

      toast({
        title: 'Success',
        description: 'Batch created successfully',
        variant: 'default',
      });

      return createdBatch;
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create batch',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateBatch = async (batchId: string, updates: Partial<Batch>) => {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(firestore, 'batches', batchId), {
        ...updates,
        updated_at: now,
      });

      const updatedBatch = batches.find((batch) => batch.id === batchId);
      await appendHistory('updated', updatedBatch?.batch_id || batchId, {
        batchId,
        updates,
      });

      toast({
        title: 'Success',
        description: 'Batch updated successfully',
        variant: 'default',
      });

      return {
        ...updatedBatch,
        ...updates,
        updated_at: now,
      } as Batch;
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update batch',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const transferBatch = async (batchId: string, newOwnerId: string, newStatus?: string) => {
    try {
      const updates: Record<string, any> = { current_owner_id: newOwnerId };
      if (newStatus) {
        updates.status = newStatus;
      }

      const now = new Date().toISOString();
      await updateDoc(doc(firestore, 'batches', batchId), {
        ...updates,
        updated_at: now,
      });

      const transferredBatch = batches.find((batch) => batch.id === batchId);
      await appendHistory('transferred', transferredBatch?.batch_id || batchId, {
        batchId,
        newOwnerId,
        newStatus,
      });

      toast({
        title: 'Success',
        description: 'Batch transferred successfully',
        variant: 'default',
      });

      return {
        ...transferredBatch,
        ...updates,
        updated_at: now,
      } as Batch;
    } catch (error) {
      console.error('Error transferring batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer batch',
        variant: 'destructive',
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
    refetch: () => reloadData(),
  };
};