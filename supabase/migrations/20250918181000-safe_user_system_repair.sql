-- REPARACIÓN SEGURA DEL SISTEMA DE USUARIOS
-- Versión más segura que no elimina datos críticos

-- PASO 1: Backup de datos existentes (si los hay)
CREATE TABLE IF NOT EXISTS backup_profiles AS
SELECT * FROM public.profiles;

CREATE TABLE IF NOT EXISTS backup_user_module_permissions AS
SELECT * FROM public.user_module_permissions;

-- PASO 2: Limpiar políticas relacionadas primero
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can insert their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can update their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can delete their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Allow all operations on modules for testing" ON public.modules;
DROP POLICY IF EXISTS "Allow all operations on permissions for testing" ON public.user_module_permissions;

-- PASO 3: Limpiar solo las tablas problemáticas
DROP TABLE IF EXISTS public.user_module_permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;

-- PASO 3: Recrear tabla de módulos (simplificada)
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 4: Recrear tabla de permisos de módulo
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- PASO 5: Insertar módulos del sistema
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

-- PASO 6: Configurar RLS básico (deshabilitado para testing)
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions DISABLE ROW LEVEL SECURITY;

-- PASO 7: Políticas básicas para testing
CREATE POLICY "Allow all operations on modules for testing" ON public.modules
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations on permissions for testing" ON public.user_module_permissions
  FOR ALL TO authenticated USING (true);

-- PASO 8: Verificación
SELECT
  'Reparación completada - Módulos:' as status,
  COUNT(*) as count
FROM public.modules;

SELECT
  'Permisos de usuario:' as status,
  COUNT(*) as count
FROM public.user_module_permissions;

-- NOTA: Después de verificar que funciona, puedes habilitar RLS:
-- ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;