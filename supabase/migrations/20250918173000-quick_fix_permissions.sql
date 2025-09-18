-- SOLUCIÓN RÁPIDA: Deshabilitar RLS temporalmente para testing
-- Ejecutar esta migración para probar el sistema sin problemas de permisos

-- Deshabilitar RLS en las tablas de permisos para testing
ALTER TABLE public.modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions DISABLE ROW LEVEL SECURITY;

-- Verificar que las tablas existen y tienen datos
SELECT
  'Modules count:' as info,
  COUNT(*) as count
FROM public.modules;

SELECT
  'Permissions count:' as info,
  COUNT(*) as count
FROM public.user_module_permissions;

-- Después de testing, puedes volver a habilitar RLS con:
-- ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Y crear las políticas de seguridad:
-- CREATE POLICY "Users can view modules" ON public.modules FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Users can manage their own module permissions" ON public.user_module_permissions FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);