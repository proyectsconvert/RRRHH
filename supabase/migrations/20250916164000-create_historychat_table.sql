-- Create historychat table for WhatsApp chat history
CREATE TABLE IF NOT EXISTS public.historychat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hicnumerouser TEXT NOT NULL,
  hicusername TEXT NOT NULL,
  hicsendnumbot TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_historychat_numero_user ON public.historychat(hicnumerouser);
CREATE INDEX IF NOT EXISTS idx_historychat_created_at ON public.historychat(created_at);

-- Set up RLS policies
ALTER TABLE public.historychat ENABLE ROW LEVEL SECURITY;

-- Policies for historychat
CREATE POLICY "Authenticated users can select historychat"
ON public.historychat FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert historychat"
ON public.historychat FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update historychat"
ON public.historychat FOR UPDATE
TO authenticated
USING (true);

-- Insert sample data for testing
INSERT INTO public.historychat (hicnumerouser, hicusername, hicsendnumbot, message, message_type)
VALUES
  ('573001234567', 'Juan Pérez', NULL, 'Hola, necesito información sobre vacantes', 'user'),
  ('573001234567', 'Juan Pérez', 'admin', '¡Hola Juan! Claro, ¿en qué área te gustaría trabajar?', 'bot'),
  ('573001234567', 'Juan Pérez', NULL, 'Me interesa desarrollo de software', 'user'),
  ('573001234567', 'Juan Pérez', 'admin', 'Excelente, tenemos varias posiciones abiertas en desarrollo. ¿Tienes experiencia con React?', 'bot'),
  ('573001234568', 'María García', NULL, 'Buenos días, vi sus vacantes en LinkedIn', 'user'),
  ('573001234568', 'María García', 'admin', '¡Buenos días María! Nos alegra que nos hayas encontrado. ¿En qué posición estás interesada?', 'bot'),
  ('573001234569', 'Carlos Rodríguez', NULL, '¿Tienen vacantes para analistas de datos?', 'user'),
  ('573001234569', 'Carlos Rodríguez', 'admin', '¡Hola Carlos! Sí, actualmente tenemos posiciones abiertas para analistas de datos. ¿Nos puedes contar un poco sobre tu experiencia?', 'bot')
ON CONFLICT DO NOTHING;