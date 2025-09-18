-- Script de debugging para verificar el estado del sistema de permisos

-- Verificar si las tablas existen
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('modules', 'user_module_permissions');

-- Verificar estructura de las tablas
\d public.modules
\d public.user_module_permissions

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('modules', 'user_module_permissions');

-- Verificar datos en las tablas
SELECT * FROM public.modules ORDER BY name;
SELECT COUNT(*) as total_permissions FROM public.user_module_permissions;

-- Verificar funciones
SELECT
  proname,
  pg_get_function_identity_arguments(oid) as args
FROM pg_proc
WHERE proname IN ('has_module_access', 'update_user_module_permissions');