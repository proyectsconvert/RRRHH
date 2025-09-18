-- FUERZA DESHABILITACIÓN DE RLS PARA PROFILES
-- Solución definitiva para el error de políticas RLS

-- PASO 1: Forzar eliminación de TODAS las políticas en profiles
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Eliminar todas las políticas existentes en la tabla profiles
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      policy_record.policyname,
                      policy_record.schemaname,
                      policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- PASO 2: Deshabilitar completamente RLS en profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PASO 3: Verificar que RLS esté deshabilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- PASO 4: Crear política temporal permisiva (opcional para testing)
-- Esta política permite todo para testing, pero puedes eliminarla después
CREATE POLICY "allow_all_profiles_for_testing" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PASO 5: Verificar políticas actuales
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

-- PASO 6: Probar inserción manual (opcional)
-- INSERT INTO public.profiles (id, email, is_active)
-- VALUES ('test-user-id', 'test@example.com', true);

SELECT
    'RLS for profiles disabled successfully' as status,
    now() as timestamp;

-- NOTA: Después de verificar que funciona, puedes:
-- 1. Eliminar la política temporal: DROP POLICY "allow_all_profiles_for_testing" ON public.profiles;
-- 2. Re-habilitar RLS: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- 3. Crear políticas restrictivas apropiadas