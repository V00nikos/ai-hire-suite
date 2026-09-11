-- Create sync_audit_log table
CREATE TABLE public.sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('scheduled', 'manual', 'realtime')),
  table_name TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.sync_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Recruiters can view sync logs"
ON public.sync_audit_log FOR SELECT
USING (is_recruiter());

CREATE POLICY "System can insert sync logs"
ON public.sync_audit_log FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update sync logs"
ON public.sync_audit_log FOR UPDATE
USING (true);

-- Create notifications table for read status tracking
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_log_id UUID REFERENCES public.activity_log(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
ON public.user_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.user_notifications FOR INSERT
WITH CHECK (true);

-- Add indexes
CREATE INDEX idx_sync_audit_log_status ON public.sync_audit_log(status);
CREATE INDEX idx_sync_audit_log_created ON public.sync_audit_log(started_at DESC);
CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id, is_read);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);

-- Create function to auto-create notifications for recruiters
CREATE OR REPLACE FUNCTION public.create_notification_for_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notifications (user_id, activity_log_id)
  SELECT p.id, NEW.id
  FROM public.profiles p
  WHERE p.id != COALESCE(NEW.actor_id, '00000000-0000-0000-0000-000000000000'::uuid);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-notifications
CREATE TRIGGER on_activity_log_insert
AFTER INSERT ON public.activity_log
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_for_activity();