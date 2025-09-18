-- RESET COMPLETO DEL SISTEMA DE USUARIOS
-- Ejecutar con precaución - esto limpiará TODOS los datos de usuarios

-- PASO 1: Limpiar políticas RLS primero (orden correcto por dependencias)
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can insert their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can update their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can delete their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view active roles" ON public.roles;

-- PASO 2: Limpiar tablas personalizadas (orden correcto por dependencias)
DROP TABLE IF EXISTS public.user_module_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- PASO 2: Limpiar datos de autenticación (esto es peligroso, usar con cuidado)
-- NOTA: No podemos eliminar la tabla auth.users, pero podemos limpiar registros problemáticos

-- Limpiar usuarios de auth que no tienen perfiles correspondientes
-- (Esto es opcional, ejecutarlo solo si sabes lo que haces)
-- DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles);

-- PASO 3: Recrear tabla de roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 4: Recrear tabla de módulos
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 5: Recrear tabla de perfiles (corregida)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 6: Recrear tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- PASO 7: Recrear tabla de permisos de módulo
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- PASO 8: Insertar roles básicos
INSERT INTO public.roles (name, display_name, description) VALUES
  ('admin', 'Administrador', 'Acceso completo al sistema'),
  ('user', 'Usuario', 'Usuario regular del sistema'),
  ('manager', 'Gerente', 'Acceso a gestión de equipo');

-- PASO 9: Insertar módulos del sistema
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

-- PASO 10: Configurar RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- PASO 11: Políticas de seguridad para roles
CREATE POLICY "Anyone can view active roles" ON public.roles
  FOR SELECT TO authenticated USING (is_active = true);

-- PASO 12: Políticas de seguridad para módulos
CREATE POLICY "Anyone can view active modules" ON public.modules
  FOR SELECT TO authenticated USING (is_active = true);

-- PASO 13: Políticas de seguridad para perfiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id::text);

-- PASO 14: Políticas de seguridad para roles de usuario
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
    )
  );

-- PASO 15: Políticas de seguridad para permisos de módulo
CREATE POLICY "Users can view own module permissions" ON public.user_module_permissions
  FOR SELECT TO authenticated USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage own module permissions" ON public.user_module_permissions
  FOR ALL TO authenticated USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all module permissions" ON public.user_module_permissions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
    )
  );

-- PASO 16: Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module_name ON public.user_module_permissions(module_name);

-- PASO 17: Verificación final
SELECT
  'Sistema de usuarios reseteado completamente' as status,
  now() as reset_timestamp;

-- Contar registros en cada tabla
SELECT
  'Roles:' as table_name,
  COUNT(*) as record_count
FROM public.roles
UNION ALL
SELECT
  'Modules:' as table_name,
  COUNT(*) as record_count
FROM public.modules
UNION ALL
SELECT
  'Profiles:' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT
  'User Roles:' as table_name,
  COUNT(*) as record_count
FROM public.user_roles
UNION ALL
SELECT
  'Module Permissions:' as table_name,
  COUNT(*) as record_count
FROM public.user_module_permissions;