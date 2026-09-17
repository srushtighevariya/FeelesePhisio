-- 009_notif_upgrade.sql — Add recipient & read-state to notification_log

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS recipient_therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title text;

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.notification_log(recipient_therapist_id, is_read);

-- RLS: therapists can select their own notifications
DROP POLICY IF EXISTS "notif_select_therapist" ON public.notification_log;
CREATE POLICY "notif_select_therapist" ON public.notification_log FOR SELECT
  USING (
    recipient_therapist_id IN (
      SELECT id FROM public.therapists WHERE user_id = auth.uid()
    )
    OR public.current_user_role() = 'admin'
  );

-- Therapists can mark their own notifications as read (update is_read)
DROP POLICY IF EXISTS "notif_update_therapist" ON public.notification_log;
CREATE POLICY "notif_update_therapist" ON public.notification_log FOR UPDATE
  USING (
    recipient_therapist_id IN (
      SELECT id FROM public.therapists WHERE user_id = auth.uid()
    )
    OR public.current_user_role() = 'admin'
  );

-- Allow system to insert notifications for therapists (admin inserts)
DROP POLICY IF EXISTS "notif_insert_system" ON public.notification_log;
CREATE POLICY "notif_insert_system" ON public.notification_log FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');
