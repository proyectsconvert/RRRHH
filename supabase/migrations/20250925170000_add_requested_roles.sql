-- Add the specific roles requested by the user
-- Migration: 20250925170000_add_requested_roles.sql

-- Insert the specific roles requested: administrador, reclutador, RC - Coordinator
INSERT INTO public.roles (name, display_name, description) VALUES
  ('administrador', 'Administrador', 'Acceso completo a todas las funcionalidades del sistema'),
  ('reclutador', 'Reclutador', 'Acceso a funcionalidades de reclutamiento'),
  ('rc_coordinator', 'RC Coordinator', 'Coordinador de Recursos Humanos')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to the new roles
-- Administrador gets all permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'administrador'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Reclutador gets candidates and jobs permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'reclutador'
AND p.module IN ('dashboard', 'candidates', 'jobs', 'campaigns')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- RC Coordinator gets most permissions except user management
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'rc_coordinator'
AND p.module IN ('dashboard', 'candidates', 'jobs', 'campaigns', 'reports', 'training', 'chatbot', 'whatsapp')
ON CONFLICT (role_id, permission_id) DO NOTHING;