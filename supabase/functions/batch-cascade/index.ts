import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, batchId, details } = await req.json();

    console.log(`Cascading batch action: ${action} for batch ${batchId}`);

    switch (action) {
      case 'createLot':
        await handleCreateLot(supabase, batchId, details);
        break;
      
      case 'processLot':
        await handleProcessLot(supabase, batchId, details);
        break;
      
      case 'formulateProduct':
        await handleFormulateProduct(supabase, batchId, details);
        break;
      
      case 'recall':
        await handleRecall(supabase, batchId, details);
        break;
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in batch cascade:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleCreateLot(supabase: any, lotId: string, details: any) {
  const { constituentBatchIds, newOwnerId, productName, quantity, unit } = details;

  // Create the lot batch
  const { data: lot, error: lotError } = await supabase
    .from('batches')
    .insert({
      batch_id: lotId,
      type: 'lot',
      status: 'created',
      current_owner_id: newOwnerId,
      product_name: productName,
      quantity: quantity,
      unit: unit,
      source_location: 'Aggregation Center'
    })
    .select()
    .single();

  if (lotError) throw lotError;

  // Update constituent batches to consolidated status
  const { error: updateError } = await supabase
    .from('batches')
    .update({ 
      status: 'consolidated',
      updated_at: new Date().toISOString()
    })
    .in('batch_id', constituentBatchIds);

  if (updateError) throw updateError;

  // Create batch links
  for (const constituentId of constituentBatchIds) {
    const { data: constituentBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('batch_id', constituentId)
      .single();

    if (constituentBatch) {
      await supabase
        .from('batch_links')
        .insert({
          parent_batch_id: lot.id,
          child_batch_id: constituentBatch.id,
          link_type: 'consolidation'
        });
    }
  }

  // Add history entry
  await supabase
    .from('batch_history')
    .insert({
      batch_id: lot.id,
      event_type: 'BatchCreated',
      actor_id: newOwnerId,
      details: {
        action: 'lot_created',
        constituent_batches: constituentBatchIds,
        total_quantity: quantity
      }
    });

  console.log(`Created lot ${lotId} with ${constituentBatchIds.length} constituent batches`);
}

async function handleProcessLot(supabase: any, processedBatchId: string, details: any) {
  const { parentLotId, newOwnerId, processType, outputQuantity, outputUnit } = details;

  // Get parent lot
  const { data: parentLot } = await supabase
    .from('batches')
    .select('*')
    .eq('batch_id', parentLotId)
    .single();

  if (!parentLot) throw new Error('Parent lot not found');

  // Create processed batch
  const { data: processedBatch, error: createError } = await supabase
    .from('batches')
    .insert({
      batch_id: processedBatchId,
      type: 'processed',
      status: 'processed',
      current_owner_id: newOwnerId,
      product_name: `Processed ${parentLot.product_name}`,
      quantity: outputQuantity,
      unit: outputUnit,
      source_location: 'Processing Unit'
    })
    .select()
    .single();

  if (createError) throw createError;

  // Update parent lot status
  await supabase
    .from('batches')
    .update({ 
      status: 'processing',
      updated_at: new Date().toISOString()
    })
    .eq('batch_id', parentLotId);

  // Create batch link
  await supabase
    .from('batch_links')
    .insert({
      parent_batch_id: processedBatch.id,
      child_batch_id: parentLot.id,
      link_type: 'processing'
    });

  // Add history
  await supabase
    .from('batch_history')
    .insert({
      batch_id: processedBatch.id,
      event_type: 'ProcessingStep',
      actor_id: newOwnerId,
      details: {
        action: 'batch_processed',
        parent_lot_id: parentLotId,
        process_type: processType,
        output_quantity: outputQuantity
      }
    });

  console.log(`Processed lot ${parentLotId} into batch ${processedBatchId}`);
}

async function handleFormulateProduct(supabase: any, finalProductId: string, details: any) {
  const { inputBatchIds, newOwnerId, productName, finalQuantity, finalUnit } = details;

  // Create final product batch
  const { data: finalProduct, error: createError } = await supabase
    .from('batches')
    .insert({
      batch_id: finalProductId,
      type: 'final_product',
      status: 'finalized',
      current_owner_id: newOwnerId,
      product_name: productName,
      quantity: finalQuantity,
      unit: finalUnit,
      source_location: 'Manufacturing Unit',
      qr_code_data: {
        batch_id: finalProductId,
        product_name: productName,
        manufactured_date: new Date().toISOString(),
        manufacturer_id: newOwnerId
      }
    })
    .select()
    .single();

  if (createError) throw createError;

  // Update input batches status
  const { error: updateError } = await supabase
    .from('batches')
    .update({ 
      status: 'finalized',
      updated_at: new Date().toISOString()
    })
    .in('batch_id', inputBatchIds);

  if (updateError) throw updateError;

  // Create batch links
  for (const inputId of inputBatchIds) {
    const { data: inputBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('batch_id', inputId)
      .single();

    if (inputBatch) {
      await supabase
        .from('batch_links')
        .insert({
          parent_batch_id: finalProduct.id,
          child_batch_id: inputBatch.id,
          link_type: 'formulation'
        });
    }
  }

  // Add history
  await supabase
    .from('batch_history')
    .insert({
      batch_id: finalProduct.id,
      event_type: 'Formulation',
      actor_id: newOwnerId,
      details: {
        action: 'final_product_created',
        input_batches: inputBatchIds,
        final_quantity: finalQuantity
      }
    });

  console.log(`Formulated final product ${finalProductId} from ${inputBatchIds.length} input batches`);
}

async function handleRecall(supabase: any, batchId: string, details: any) {
  const { reason, actorId } = details;

  // Update batch status to recalled
  await supabase
    .from('batches')
    .update({ 
      status: 'recalled',
      updated_at: new Date().toISOString()
    })
    .eq('batch_id', batchId);

  // Find all linked batches (both upstream and downstream)
  const { data: linkedBatches } = await supabase
    .from('batch_links')
    .select(`
      parent_batch_id,
      child_batch_id,
      parent_batch:parent_batch_id(batch_id),
      child_batch:child_batch_id(batch_id)
    `)
    .or(`parent_batch_id.eq.${batchId},child_batch_id.eq.${batchId}`);

  // Update all linked batches to recalled
  if (linkedBatches) {
    for (const link of linkedBatches) {
      if (link.parent_batch_id !== batchId) {
        await supabase
          .from('batches')
          .update({ status: 'recalled', updated_at: new Date().toISOString() })
          .eq('id', link.parent_batch_id);
      }
      if (link.child_batch_id !== batchId) {
        await supabase
          .from('batches')
          .update({ status: 'recalled', updated_at: new Date().toISOString() })
          .eq('id', link.child_batch_id);
      }
    }
  }

  // Create notifications for all stakeholders
  const { data: allUsers } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (allUsers) {
    for (const user of allUsers) {
      await supabase
        .from('notifications')
        .insert({
          user_id: user.user_id,
          title: 'Batch Recall Alert',
          message: `Batch ${batchId} has been recalled. Reason: ${reason}`,
          type: 'warning',
          batch_id: batchId
        });
    }
  }

  // Add history
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
        event_type: 'Recall',
        actor_id: actorId,
        details: {
          action: 'batch_recalled',
          reason: reason,
          recall_date: new Date().toISOString()
        }
      });
  }

  console.log(`Recalled batch ${batchId} and all linked batches. Reason: ${reason}`);
}