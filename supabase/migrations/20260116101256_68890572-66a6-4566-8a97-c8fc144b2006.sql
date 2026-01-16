-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    subtotal NUMERIC NOT NULL,
    shipping_cost NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admins can manage all invoices
CREATE POLICY "Admins can manage invoices"
ON public.invoices FOR ALL
USING (public.is_admin(auth.uid()));

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = invoices.order_id
        AND orders.customer_id = auth.uid()
    )
);

-- Create merchant_earnings table for tracking income
CREATE TABLE public.merchant_earnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    order_item_id UUID REFERENCES public.order_items(id),
    amount NUMERIC NOT NULL,
    commission_rate NUMERIC DEFAULT 0.10,
    commission_amount NUMERIC NOT NULL,
    net_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on merchant_earnings
ALTER TABLE public.merchant_earnings ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own earnings
CREATE POLICY "Merchants can view own earnings"
ON public.merchant_earnings FOR SELECT
USING (auth.uid() = merchant_id);

-- Admins can manage all earnings
CREATE POLICY "Admins can manage earnings"
ON public.merchant_earnings FOR ALL
USING (public.is_admin(auth.uid()));

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_details JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Merchants can view and create their own requests
CREATE POLICY "Merchants can view own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can create withdrawals"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = merchant_id);

-- Admins can manage all withdrawals
CREATE POLICY "Admins can manage withdrawals"
ON public.withdrawal_requests FOR ALL
USING (public.is_admin(auth.uid()));

-- Add merchant_id to products table for multi-vendor
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS merchant_id UUID;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for invoice number
CREATE TRIGGER generate_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoice_number();

-- Function to send notification (helper)
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify customer
    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES (
        NEW.customer_id,
        'تحديث حالة الطلب',
        'تم تحديث حالة طلبك رقم ' || NEW.order_number || ' إلى ' || NEW.status,
        'order_update',
        jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.status)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for order status change notifications
CREATE TRIGGER notify_on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_order_status_change();