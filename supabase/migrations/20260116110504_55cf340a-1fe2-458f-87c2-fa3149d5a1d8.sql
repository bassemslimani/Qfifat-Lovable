-- Add shipping tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS current_location TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create shipping tracking history table
CREATE TABLE IF NOT EXISTS public.shipping_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for shipping_tracking
CREATE POLICY "Users can view their order tracking" ON public.shipping_tracking
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = shipping_tracking.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage tracking" ON public.shipping_tracking
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Merchants can update their order tracking" ON public.shipping_tracking
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o.id = shipping_tracking.order_id
    AND p.merchant_id = auth.uid()
  )
);

-- Enable realtime for tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_tracking;