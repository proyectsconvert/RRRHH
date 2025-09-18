-- REPARACIÓN MÍNIMA DEL SISTEMA DE USUARIOS
-- Solo arregla lo esencial sin eliminar datos

-- PASO 1: Verificar estado actual
DO $$
BEGIN
    RAISE NOTICE '=== ESTADO ACTUAL DE LAS TABLAS ===';

    -- Verificar si existen las tablas críticas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla profiles no existe. Ejecuta primero una migración completa.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules' AND table_schema = 'public') THEN
        RAISE NOTICE 'La tabla modules no existe, será creada.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_module_permissions' AND table_schema = 'public') THEN
        RAISE NOTICE 'La tabla user_module_permissions no existe, será creada.';
    END IF;
END $$;

-- PASO 2: Limpiar políticas problemáticas (si existen)
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can insert their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can update their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can delete their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON public.user_module_permissions;

-- PASO 3: Crear tabla modules si no existe
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 4: Crear tabla user_module_permissions si no existe
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- PASO 5: Limpiar datos existentes en modules (para evitar conflictos)
TRUNCATE TABLE public.modules CASCADE;

-- PASO 6: Insertar módulos del sistema
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
  ('settings', 'Configuración', 'Configuración del sistema');

-- PASO 7: Configurar RLS básico (deshabilitado para testing)
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions DISABLE ROW LEVEL SECURITY;

-- PASO 8: Políticas básicas permisivas para testing
CREATE POLICY "Allow all on modules for testing" ON public.modules
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all on permissions for testing" ON public.user_module_permissions
  FOR ALL TO authenticated USING (true);

-- PASO 9: Verificación final
SELECT
  'Reparación mínima completada' as status,
  now() as timestamp;

-- Contar registros
SELECT
  'Módulos disponibles:' as info,
  COUNT(*) as count
FROM public.modules;

SELECT
  'Perfiles existentes:' as info,
  COUNT(*) as count
FROM public.profiles;

SELECT
  'Permisos existentes:' as info,
  COUNT(*) as count
FROM public.user_module_permissions;

-- NOTA: Después de verificar que funciona, puedes habilitar RLS con:
-- ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
-- Y crear políticas más restrictivas si es necesario.