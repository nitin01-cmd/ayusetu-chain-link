-- Create enum types for batch types and statuses
CREATE TYPE batch_type AS ENUM ('raw_material', 'lot', 'processed', 'final_product');
CREATE TYPE batch_status AS ENUM ('created', 'in_transit', 'received', 'processing', 'processed', 'consolidated', 'finalized', 'dispatched', 'recalled');
CREATE TYPE user_role AS ENUM ('aggregator', 'processor', 'manufacturer', 'distributor');
CREATE TYPE event_type AS ENUM ('BatchCreated', 'CustodyTransfer', 'ProcessingStep', 'Formulation', 'Dispatch', 'ConsolidatedIntoLot', 'Recall');

-- Create batches table (main traceability backbone)
CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT UNIQUE NOT NULL,
    type batch_type NOT NULL,
    status batch_status NOT NULL DEFAULT 'created',
    current_owner_id UUID REFERENCES auth.users(id),
    farmer_id TEXT,
    farmer_name TEXT,
    farmer_phone TEXT,
    farmer_location TEXT,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2),
    unit TEXT,
    source_location TEXT,
    destination_location TEXT,
    qr_code_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create batch history for immutable event tracking
CREATE TABLE public.batch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    event_type event_type NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    actor_id UUID REFERENCES auth.users(id),
    details JSONB DEFAULT '{}',
    documents TEXT[], -- Array of file URLs
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    batch_id UUID REFERENCES public.batches(id),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create dev OTPs for development login
CREATE TABLE public.dev_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    otp TEXT NOT NULL,
    role user_role NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create batch links table for parent-child relationships
CREATE TABLE public.batch_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    child_batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL, -- 'consolidation', 'processing', 'formulation'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_batch_id, child_batch_id)
);

-- Enable RLS on all tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_links ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

-- RLS Policies for batches (role-based access)
CREATE POLICY "Aggregators can see raw materials and lots they own"
ON public.batches FOR ALL
TO authenticated
USING (
    get_user_role(auth.uid()) = 'aggregator' AND 
    (type IN ('raw_material', 'lot') AND current_owner_id = auth.uid())
);

CREATE POLICY "Processors can see in-transit and received batches"
ON public.batches FOR ALL
TO authenticated
USING (
    get_user_role(auth.uid()) = 'processor' AND 
    (status IN ('in_transit', 'received') OR current_owner_id = auth.uid())
);

CREATE POLICY "Manufacturers can see processed and final products"
ON public.batches FOR ALL
TO authenticated
USING (
    get_user_role(auth.uid()) = 'manufacturer' AND 
    (type IN ('processed', 'final_product') OR current_owner_id = auth.uid())
);

CREATE POLICY "Distributors can see finalized products"
ON public.batches FOR ALL
TO authenticated
USING (
    get_user_role(auth.uid()) = 'distributor' AND 
    (status = 'finalized' OR current_owner_id = auth.uid())
);

-- RLS Policies for batch_history
CREATE POLICY "Users can see history of batches they have access to"
ON public.batch_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.batches b 
        WHERE b.id = batch_history.batch_id AND (
            (get_user_role(auth.uid()) = 'aggregator' AND b.type IN ('raw_material', 'lot') AND b.current_owner_id = auth.uid()) OR
            (get_user_role(auth.uid()) = 'processor' AND (b.status IN ('in_transit', 'received') OR b.current_owner_id = auth.uid())) OR
            (get_user_role(auth.uid()) = 'manufacturer' AND (b.type IN ('processed', 'final_product') OR b.current_owner_id = auth.uid())) OR
            (get_user_role(auth.uid()) = 'distributor' AND (b.status = 'finalized' OR b.current_owner_id = auth.uid()))
        )
    )
);

CREATE POLICY "Users can insert history for their batches"
ON public.batch_history FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.batches b 
        WHERE b.id = batch_history.batch_id AND b.current_owner_id = auth.uid()
    )
);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for batch_links
CREATE POLICY "Users can view links for accessible batches"
ON public.batch_links FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.batches WHERE id = parent_batch_id) OR
    EXISTS (SELECT 1 FROM public.batches WHERE id = child_batch_id)
);

-- RLS Policy for dev_otps (public read for development)
CREATE POLICY "Dev OTPs are publicly readable"
ON public.dev_otps FOR SELECT
TO anon, authenticated
USING (true);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for batches updated_at
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Create function to automatically add batch history on status changes
CREATE OR REPLACE FUNCTION public.add_batch_history_on_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic history logging
CREATE TRIGGER batch_status_change_trigger
    AFTER UPDATE ON public.batches
    FOR EACH ROW
    EXECUTE FUNCTION public.add_batch_history_on_update();

-- Enable realtime for tables
ALTER TABLE public.batches REPLICA IDENTITY FULL;
ALTER TABLE public.batch_history REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert sample dev OTPs
INSERT INTO public.dev_otps (phone, otp, role, expires_at) VALUES
('+911234567890', '123456', 'aggregator', now() + interval '1 year'),
('+911234567891', '123456', 'processor', now() + interval '1 year'),
('+911234567892', '123456', 'manufacturer', now() + interval '1 year'),
('+911234567893', '123456', 'distributor', now() + interval '1 year');

-- Insert sample batches for testing
INSERT INTO public.batches (batch_id, type, status, farmer_id, farmer_name, farmer_phone, farmer_location, product_name, quantity, unit, source_location) VALUES
('RAW001', 'raw_material', 'created', 'F001', 'Ravi Kumar', '+919876543210', 'Village Kharkhoda, Haryana', 'Wheat', 1000.00, 'kg', 'Farm Gate'),
('RAW002', 'raw_material', 'created', 'F002', 'Sunita Devi', '+919876543211', 'Village Bhiwani, Haryana', 'Rice', 800.00, 'kg', 'Farm Gate'),
('RAW003', 'raw_material', 'created', 'F003', 'Mohan Singh', '+919876543212', 'Village Rohtak, Haryana', 'Wheat', 1200.00, 'kg', 'Farm Gate');