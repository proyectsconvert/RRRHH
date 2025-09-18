-- SOLUCIÓN COMPLETA PARA TODOS LOS PROBLEMAS DE RLS
-- Deshabilita RLS en todas las tablas relacionadas con usuarios

-- PASO 1: Limpiar TODAS las políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== ELIMINANDO TODAS LAS POLÍTICAS DE USUARIOS ===';

    -- Eliminar políticas en todas las tablas relacionadas
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'modules', 'user_module_permissions', 'roles', 'user_roles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname,
                      policy_record.schemaname,
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %.% on %', policy_record.tablename, policy_record.policyname, policy_record.schemaname;
    END LOOP;
END $$;

-- PASO 2: Deshabilitar RLS en TODAS las tablas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tablas opcionales (si existen)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on roles table';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on user_roles table';
    END IF;
END $$;

-- PASO 3: Crear políticas temporales permisivas para testing
CREATE POLICY "temp_allow_all_profiles" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "temp_allow_all_modules" ON public.modules
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "temp_allow_all_permissions" ON public.user_module_permissions
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PASO 4: Verificar estado de RLS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'modules', 'user_module_permissions', 'roles', 'user_roles')
ORDER BY tablename;

-- PASO 5: Verificar políticas actuales
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'modules', 'user_module_permissions')
ORDER BY tablename, policyname;

-- PASO 6: Contar registros en cada tabla
SELECT
    'Profiles count:' as table_info,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT
    'Modules count:' as table_info,
    COUNT(*) as record_count
FROM public.modules
UNION ALL
SELECT
    'Permissions count:' as table_info,
    COUNT(*) as record_count
FROM public.user_module_permissions;

-- PASO 7: Probar inserción manual en profiles (opcional)
-- INSERT INTO public.profiles (id, email, is_active)
-- VALUES ('test-user-' || extract(epoch from now())::text, 'test@example.com', true);

SELECT
    'RLS completely disabled for user system - ready for testing' as status,
    now() as completed_at;

-- === NOTAS IMPORTANTES ===
-- 1. Después de verificar que funciona, puedes re-habilitar RLS:
--    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
--
-- 2. Para eliminar las políticas temporales:
--    DROP POLICY "temp_allow_all_profiles" ON public.profiles;
--    DROP POLICY "temp_allow_all_modules" ON public.modules;
--    DROP POLICY "temp_allow_all_permissions" ON public.user_module_permissions;
--
-- 3. Para crear políticas restrictivas apropiadas, consulta la documentación de Supabase RLS