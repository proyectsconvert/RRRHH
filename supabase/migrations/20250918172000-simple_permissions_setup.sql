-- Configuración simplificada del sistema de permisos
-- Ejecutar PASO A PASO si la migración completa falla

-- PASO 1: Limpiar todo (ejecutar primero)
DROP TABLE IF EXISTS public.user_module_permissions;
DROP TABLE IF EXISTS public.modules;
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can insert their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can update their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can delete their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON public.user_module_permissions;
DROP FUNCTION IF EXISTS public.has_module_access(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.update_user_module_permissions(UUID, JSONB);

-- PASO 2: Crear tabla de módulos
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 3: Crear tabla de permisos
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- PASO 4: Insertar módulos
INSERT INTO public.modules (name, display_name, description) VALUES
  ('dashboard', 'Dashboard', 'Acceso al panel principal'),
  ('users', 'Usuarios', 'Gestión de usuarios del sistema'),
  ('candidates', 'Candidatos', 'Gestión de candidatos'),
  ('jobs', 'Vacantes', 'Gestión de ofertas de trabajo'),
  ('campaigns', 'Campañas', 'Gestión de campañas de reclutamiento'),
  ('chatbot', 'Chatbot', 'Configuración del chatbot'),
  ('whatsapp', 'WhatsApp', 'Gestión de WhatsApp Business'),
  ('training', 'Entrenamiento', 'Códigos y sesiones de entrenamiento'),
  ('reports', 'Reportes', 'Visualización de reportes'),
  ('settings', 'Configuración', 'Configuración del sistema')
ON CONFLICT (name) DO NOTHING;

-- PASO 5: Configurar RLS (deshabilitar temporalmente para testing)
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions DISABLE ROW LEVEL SECURITY;

-- PASO 6: Crear políticas simples (después de testing, habilitar RLS y estas políticas)
-- ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view modules" ON public.modules
--   FOR SELECT TO authenticated USING (true);

-- CREATE POLICY "Users can manage their own module permissions" ON public.user_module_permissions
--   FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

-- PASO 7: Crear funciones (opcional, el frontend puede usar consultas directas)
-- CREATE FUNCTION public.has_module_access(user_id UUID, module_name VARCHAR)
-- RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
-- AS $$
--   SELECT COALESCE(
--     (SELECT has_access FROM public.user_module_permissions
--      WHERE user_id = $1 AND module_name = $2), false
--   );
-- $$;

-- Verificación final
SELECT 'Módulos creados:' as info, COUNT(*) as count FROM public.modules;
SELECT 'Permisos de usuario:' as info, COUNT(*) as count FROM public.user_module_permissions;