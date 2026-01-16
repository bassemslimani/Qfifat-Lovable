-- Fix the RLS policy for notifications to be more secure
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

-- Only allow authenticated users to receive notifications, and admins can insert
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);

-- The trigger function uses SECURITY DEFINER so it can insert notifications