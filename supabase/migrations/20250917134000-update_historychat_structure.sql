-- Update historychat table structure to match current usage
-- Add hicmessagebot and hicmessageuser columns, remove old message and message_type

ALTER TABLE public.historychat
ADD COLUMN IF NOT EXISTS hicmessagebot TEXT,
ADD COLUMN IF NOT EXISTS hicmessageuser TEXT;

-- Migrate existing data
UPDATE public.historychat
SET
  hicmessagebot = CASE WHEN message_type = 'bot' THEN message ELSE NULL END,
  hicmessageuser = CASE WHEN message_type = 'user' THEN message ELSE NULL END
WHERE hicmessagebot IS NULL AND hicmessageuser IS NULL;

-- Update RLS policies to allow service role access for webhooks
CREATE POLICY "Service role can insert historychat"
ON public.historychat FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can select historychat"
ON public.historychat FOR SELECT
TO service_role
USING (true);

-- Optional: Keep old columns for backward compatibility but make them nullable
-- ALTER TABLE public.historychat ALTER COLUMN message DROP NOT NULL;
-- ALTER TABLE public.historychat ALTER COLUMN message_type DROP NOT NULL;