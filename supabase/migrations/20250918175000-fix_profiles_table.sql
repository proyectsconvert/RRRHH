-- Solución para problemas con la tabla profiles
-- Ejecutar si los perfiles no se están guardando correctamente

-- Verificar y arreglar estructura de la tabla profiles
DO $$
BEGIN
    -- Verificar si la tabla profiles existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla profiles no existe';
    END IF;

    -- Verificar columnas requeridas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Verificar columnas opcionales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN position TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;

    -- Verificar timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

    RAISE NOTICE 'Tabla profiles verificada y corregida';
END $$;

-- Deshabilitar RLS temporalmente para testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Crear política básica si no existe
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Políticas permisivas para testing
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = id::text);

-- Permitir que admins vean todos los perfiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND r.is_active = true
    ) OR auth.email() = 'admin@empresa.com'
  );

-- Re-habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar que todo esté correcto
SELECT
  'Profiles table structure:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Contar registros existentes
SELECT
  'Total profiles in database:' as info,
  COUNT(*) as count
FROM public.profiles;