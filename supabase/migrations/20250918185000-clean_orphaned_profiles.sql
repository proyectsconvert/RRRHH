-- LIMPIEZA DE PERFILES HUÉRFANOS
-- Elimina perfiles que no tienen usuario auth correspondiente

-- PASO 1: Identificar perfiles huérfanos
SELECT
    'Perfiles huérfanos encontrados:' as status,
    COUNT(*) as count
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- PASO 2: Crear backup antes de eliminar
CREATE TABLE IF NOT EXISTS backup_orphaned_profiles AS
SELECT p.*, 'orphaned' as status, now() as backed_up_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- PASO 3: Eliminar perfiles huérfanos
DELETE FROM public.profiles
WHERE id NOT IN (
    SELECT id FROM auth.users
);

-- PASO 4: Verificar limpieza
SELECT
    'Perfiles después de limpieza:' as status,
    COUNT(*) as total_profiles
FROM public.profiles;

SELECT
    'Usuarios auth existentes:' as status,
    COUNT(*) as total_auth_users
FROM auth.users;

-- PASO 5: Verificar consistencia
SELECT
    'Perfiles sin usuario auth:' as status,
    COUNT(*) as orphaned_count
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- PASO 6: Limpiar permisos huérfanos también
DELETE FROM public.user_module_permissions
WHERE user_id NOT IN (
    SELECT id FROM public.profiles
);

SELECT
    'Permisos después de limpieza:' as status,
    COUNT(*) as permissions_count
FROM public.user_module_permissions;

-- PASO 7: Verificación final
SELECT
    'Sistema de usuarios limpiado exitosamente' as final_status,
    now() as completed_at;

-- NOTA: Si hay perfiles huérfanos, fueron movidos a backup_orphaned_profiles
-- para posible recuperación si es necesario.