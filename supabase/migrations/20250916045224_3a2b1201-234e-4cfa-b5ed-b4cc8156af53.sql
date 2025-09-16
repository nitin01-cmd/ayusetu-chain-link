-- Fix security issues by setting search_path for functions

-- Update the get_user_role function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- Update the add_batch_history_on_update function with proper search_path
CREATE OR REPLACE FUNCTION public.add_batch_history_on_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Only add history if status changed
    IF OLD.status != NEW.status THEN
        INSERT INTO public.batch_history (batch_id, event_type, actor_id, details)
        VALUES (
            NEW.id,
            CASE 
                WHEN NEW.status = 'consolidated' THEN 'ConsolidatedIntoLot'::event_type
                WHEN NEW.status = 'in_transit' THEN 'CustodyTransfer'::event_type
                WHEN NEW.status = 'processing' THEN 'ProcessingStep'::event_type
                WHEN NEW.status = 'finalized' THEN 'Formulation'::event_type
                WHEN NEW.status = 'dispatched' THEN 'Dispatch'::event_type
                WHEN NEW.status = 'recalled' THEN 'Recall'::event_type
                ELSE 'BatchCreated'::event_type
            END,
            auth.uid(),
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'batch_id', NEW.batch_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$;