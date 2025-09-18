-- Create user roles and permissions system
-- Migration: 20250917200000_create_user_roles_permissions.sql

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- dashboard, candidates, jobs, etc.
  action VARCHAR(50) NOT NULL, -- view, create, edit, delete, manage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Create user_permissions table for specific user permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, permission_id)
);

-- Update profiles table to include additional user information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_permissions_module_action ON public.permissions(module, action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON public.user_permissions(permission_id);

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

-- RLS Policies for permissions table
CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage permissions"
ON public.permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

-- RLS Policies for role_permissions table
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage role permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "Admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

-- RLS Policies for user_permissions table
CREATE POLICY "Users can view their own permissions"
ON public.user_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user permissions"
ON public.user_permissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
    AND ur.is_active = true
  )
);

-- Insert default roles
INSERT INTO public.roles (name, display_name, description) VALUES
  ('admin', 'Administrador', 'Acceso completo a todas las funcionalidades del sistema'),
  ('manager', 'Gerente', 'Acceso a gestión de candidatos, vacantes y reportes'),
  ('recruiter', 'Reclutador', 'Acceso a gestión de candidatos y vacantes'),
  ('interviewer', 'Entrevistador', 'Acceso limitado a candidatos asignados'),
  ('viewer', 'Observador', 'Acceso de solo lectura a reportes y estadísticas')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
  -- Dashboard permissions
  ('dashboard.view', 'Ver Dashboard', 'Acceso al panel principal del dashboard', 'dashboard', 'view'),
  ('dashboard.manage', 'Gestionar Dashboard', 'Configurar y personalizar el dashboard', 'dashboard', 'manage'),

  -- Candidates permissions
  ('candidates.view', 'Ver Candidatos', 'Ver lista de candidatos', 'candidates', 'view'),
  ('candidates.create', 'Crear Candidatos', 'Agregar nuevos candidatos', 'candidates', 'create'),
  ('candidates.edit', 'Editar Candidatos', 'Modificar información de candidatos', 'candidates', 'edit'),
  ('candidates.delete', 'Eliminar Candidatos', 'Eliminar candidatos del sistema', 'candidates', 'delete'),
  ('candidates.manage', 'Gestionar Candidatos', 'Acceso completo a gestión de candidatos', 'candidates', 'manage'),

  -- Jobs permissions
  ('jobs.view', 'Ver Vacantes', 'Ver lista de vacantes', 'jobs', 'view'),
  ('jobs.create', 'Crear Vacantes', 'Crear nuevas vacantes', 'jobs', 'create'),
  ('jobs.edit', 'Editar Vacantes', 'Modificar vacantes existentes', 'jobs', 'edit'),
  ('jobs.delete', 'Eliminar Vacantes', 'Eliminar vacantes del sistema', 'jobs', 'delete'),
  ('jobs.manage', 'Gestionar Vacantes', 'Acceso completo a gestión de vacantes', 'jobs', 'manage'),

  -- Campaigns permissions
  ('campaigns.view', 'Ver Campañas', 'Ver campañas de reclutamiento', 'campaigns', 'view'),
  ('campaigns.create', 'Crear Campañas', 'Crear nuevas campañas', 'campaigns', 'create'),
  ('campaigns.edit', 'Editar Campañas', 'Modificar campañas existentes', 'campaigns', 'edit'),
  ('campaigns.delete', 'Eliminar Campañas', 'Eliminar campañas', 'campaigns', 'delete'),
  ('campaigns.manage', 'Gestionar Campañas', 'Acceso completo a gestión de campañas', 'campaigns', 'manage'),

  -- Chatbot permissions
  ('chatbot.view', 'Ver Chatbot', 'Acceso al gestor de chatbot', 'chatbot', 'view'),
  ('chatbot.manage', 'Gestionar Chatbot', 'Configurar y gestionar el chatbot', 'chatbot', 'manage'),

  -- WhatsApp permissions
  ('whatsapp.view', 'Ver WhatsApp', 'Acceso al panel de WhatsApp', 'whatsapp', 'view'),
  ('whatsapp.manage', 'Gestionar WhatsApp', 'Control completo del bot de WhatsApp', 'whatsapp', 'manage'),

  -- Training permissions
  ('training.view', 'Ver Entrenamientos', 'Acceso a códigos y sesiones de entrenamiento', 'training', 'view'),
  ('training.manage', 'Gestionar Entrenamientos', 'Crear y gestionar códigos de entrenamiento', 'training', 'manage'),

  -- Reports permissions
  ('reports.view', 'Ver Reportes', 'Acceso a reportes y estadísticas', 'reports', 'view'),
  ('reports.create', 'Crear Reportes', 'Generar nuevos reportes', 'reports', 'create'),
  ('reports.manage', 'Gestionar Reportes', 'Acceso completo a gestión de reportes', 'reports', 'manage'),

  -- Settings permissions
  ('settings.view', 'Ver Configuración', 'Acceso a configuración del sistema', 'settings', 'view'),
  ('settings.manage', 'Gestionar Configuración', 'Modificar configuración del sistema', 'settings', 'manage'),

  -- Users permissions
  ('users.view', 'Ver Usuarios', 'Ver lista de usuarios del sistema', 'users', 'view'),
  ('users.create', 'Crear Usuarios', 'Crear nuevos usuarios', 'users', 'create'),
  ('users.edit', 'Editar Usuarios', 'Modificar información de usuarios', 'users', 'edit'),
  ('users.delete', 'Eliminar Usuarios', 'Eliminar usuarios del sistema', 'users', 'delete'),
  ('users.manage', 'Gestionar Usuarios', 'Acceso completo a gestión de usuarios', 'users', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager gets most permissions except user management and system settings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'manager'
AND p.module IN ('dashboard', 'candidates', 'jobs', 'campaigns', 'reports', 'training')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Recruiter gets candidates and jobs permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'recruiter'
AND p.module IN ('dashboard', 'candidates', 'jobs', 'campaigns')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Interviewer gets limited candidates access
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'interviewer'
AND p.name IN ('candidates.view', 'dashboard.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer gets only view permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'viewer'
AND p.action = 'view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION public.has_permission(target_user_id UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has the permission through their roles
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = target_user_id
    AND p.name = permission_name
    AND ur.is_active = true
    AND p.name IS NOT NULL
  )
  OR
  -- Check if user has the permission directly assigned
  EXISTS (
    SELECT 1
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = target_user_id
    AND p.name = permission_name
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > now())
  );
END;
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id UUID)
RETURNS TABLE(role_name TEXT, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.display_name
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = target_user_id
  AND ur.is_active = true
  AND r.is_active = true;
END;
$$;

-- Create function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, role_name TEXT, assigned_by_param UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role_id UUID;
  assignment_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = role_name AND is_active = true;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role % not found or inactive', role_name;
  END IF;

  -- Insert user role assignment
  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (target_user_id, v_role_id, COALESCE(assigned_by_param, auth.uid()))
  ON CONFLICT (user_id, role_id)
  DO UPDATE SET
    assigned_by = COALESCE(assigned_by_param, auth.uid()),
    assigned_at = now(),
    is_active = true
  RETURNING id INTO assignment_id;

  RETURN assignment_id;
END;
$$;