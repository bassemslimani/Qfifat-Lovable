-- Create reviews table
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Authenticated users can create reviews" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete reviews" ON public.reviews
FOR DELETE USING (is_admin(auth.uid()));

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Only admins can manage coupons" ON public.coupons
FOR ALL USING (is_admin(auth.uid()));

-- Create coupon_uses table for tracking
CREATE TABLE public.coupon_uses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    discount_amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(coupon_id, order_id)
);

-- Enable RLS
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- Coupon uses policies
CREATE POLICY "Users can view their coupon uses" ON public.coupon_uses
FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create coupon uses" ON public.coupon_uses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET 
        rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE product_id = NEW.product_id AND is_approved = true),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id AND is_approved = true)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for rating update
CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();

-- Create updated_at triggers
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();