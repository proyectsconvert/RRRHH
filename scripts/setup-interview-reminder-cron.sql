-- ============================================================
-- Setup: Interview Reminder Cron Job
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Add reminder tracking columns to applications (if not already done)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS reminder_30_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_15_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Step 3: Create the cron job — runs every minute
-- Replace YOUR_SERVICE_ROLE_KEY with the actual key from
-- Supabase Dashboard → Settings → API → service_role key
SELECT cron.schedule(
  'interview-reminders-every-minute',   -- job name
  '* * * * *',                          -- every minute
  $$
  SELECT net.http_post(
    url     := 'https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/send-interview-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Verify the job was created:
-- SELECT * FROM cron.job;

-- To remove the job later if needed:
-- SELECT cron.unschedule('interview-reminders-every-minute');
