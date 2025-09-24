# 🚨 MIGRACIÓN PENDIENTE - Campañas en Candidatos

## Problema
El apartado de candidatos no puede cargar porque falta el campo `campaign_id` en la tabla `applications`.

## Solución
Ejecuta esta migración SQL en tu panel de Supabase:

### SQL a Ejecutar:
```sql
-- Add campaign_id column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'applications' AND column_name = 'campaign_id';
```

### Pasos:
1. Ve a tu [Panel de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Copia y pega el SQL de arriba
5. Haz click en "Run"

### Después de la migración:
1. Recarga la página de candidatos (`/admin/candidates`)
2. La columna "Campaña" se activará automáticamente
3. Podrás asignar campañas a candidatos desde "Cambiar Estado" > "Asignar Campaña"

## Archivos relacionados:
- `supabase/migrations/20250923160000_add_campaign_id_to_applications.sql` - Migración SQL
- `src/pages/admin/Candidates.tsx` - Código actualizado para mostrar campañas

## Funcionalidades que se activarán:
- ✅ Columna "Campaña" visible en la tabla
- ✅ Selector de campañas en el modal de cambio de estado
- ✅ Asignación de campañas a aplicaciones de candidatos
- ✅ Visualización de campañas asignadas con badges