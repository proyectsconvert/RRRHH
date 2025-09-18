-- Simplificar el sistema de permisos basado en módulos del sidebar

-- Eliminar tablas existentes si existen (para recrear limpias)
DROP TABLE IF EXISTS public.user_module_permissions;
DROP TABLE IF EXISTS public.modules;

-- Crear tabla de módulos disponibles
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de permisos de usuario por módulo
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- Insertar módulos disponibles basados en el sidebar
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

-- Habilitar RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view modules" ON public.modules;
DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Admins can manage all module permissions" ON public.user_module_permissions;

-- Políticas para módulos (solo lectura para usuarios autenticados)
CREATE POLICY "Users can view modules" ON public.modules
  FOR SELECT TO authenticated USING (true);

-- Políticas para permisos de usuario (más permisivas para debugging)
CREATE POLICY "Users can view their own module permissions" ON public.user_module_permissions
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own module permissions" ON public.user_module_permissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own module permissions" ON public.user_module_permissions
  FOR UPDATE TO authenticated USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own module permissions" ON public.user_module_permissions
  FOR DELETE TO authenticated USING (auth.uid()::text = user_id::text);

-- Política especial para admins (temporal para debugging)
CREATE POLICY "Admins can manage all module permissions" ON public.user_module_permissions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND r.is_active = true
    ) OR auth.email() = 'admin@empresa.com'
  );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module_name ON public.user_module_permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_modules_name ON public.modules(name);

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS public.has_module_access(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.update_user_module_permissions(UUID, JSONB);

-- Función para verificar si un usuario tiene acceso a un módulo
CREATE FUNCTION public.has_module_access(user_id UUID, module_name VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN := false;
BEGIN
  -- Si es admin, siempre tiene acceso
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id AND r.name = 'admin' AND r.is_active = true
  ) THEN
    RETURN true;
  END IF;

  -- Verificar permiso específico del módulo
  SELECT ump.has_access INTO has_access
  FROM public.user_module_permissions ump
  WHERE ump.user_id = user_id AND ump.module_name = module_name;

  RETURN COALESCE(has_access, false);
END;
$$;

-- Función para actualizar permisos de módulo de un usuario
CREATE FUNCTION public.update_user_module_permissions(
  p_user_id UUID,
  p_module_permissions JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  module_name TEXT;
  has_access BOOLEAN;
BEGIN
  -- Limpiar permisos existentes para este usuario
  DELETE FROM public.user_module_permissions WHERE user_id = p_user_id;

  -- Insertar nuevos permisos
  FOR module_name IN SELECT jsonb_object_keys(p_module_permissions)
  LOOP
    has_access := (p_module_permissions->>module_name)::BOOLEAN;

    INSERT INTO public.user_module_permissions (user_id, module_name, has_access)
    VALUES (p_user_id, module_name, has_access);
  END LOOP;
END;
$$;