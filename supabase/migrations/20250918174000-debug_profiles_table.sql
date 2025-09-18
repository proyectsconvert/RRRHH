-- Diagnóstico de la tabla profiles
-- Ejecutar para verificar por qué no se guardan los datos del perfil

-- Verificar estructura de la tabla profiles
\d public.profiles

-- Verificar si hay registros en profiles
SELECT
  'Total profiles:' as info,
  COUNT(*) as count
FROM public.profiles;

-- Verificar los últimos 5 perfiles creados
SELECT
  id,
  email,
  first_name,
  last_name,
  phone,
  position,
  department,
  is_active,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Verificar restricciones y triggers en la tabla profiles
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
WHERE conrelid = 'public.profiles'::regclass;

-- Verificar políticas RLS en profiles
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
  AND tablename = 'profiles';

-- Verificar índices en profiles
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles';

-- Probar inserción manual para verificar errores
-- (Comenta/descomenta estas líneas según necesites)
-- INSERT INTO public.profiles (id, email, first_name, last_name, phone, position, department, is_active)
-- VALUES ('test-user-id', 'test@example.com', 'Test', 'User', '+1234567890', 'Test Position', 'Test Department', true);