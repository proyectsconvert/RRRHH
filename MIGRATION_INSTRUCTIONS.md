# 🚀 Migración de Campos de Candidatos

## Problema
Los campos adicionales (`cedula`, `birth_date`, `application_source`) no se están guardando correctamente porque la migración no se ha aplicado a la base de datos.

## ✅ Solución - Aplicar Migración Manual

### 📋 SQL a Ejecutar

Ve al **Supabase Dashboard** → **SQL Editor** y ejecuta este SQL:

```sql
-- Agregar campos adicionales a la tabla candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula);

-- Agregar comentarios de documentación
COMMENT ON COLUMN candidates.cedula IS 'National ID number of the candidate';
COMMENT ON COLUMN candidates.birth_date IS 'Date of birth of the candidate';
COMMENT ON COLUMN candidates.application_source IS 'How the candidate found the job opportunity';
```

### 🔧 Pasos Detallados

1. **Abrir Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql

2. **Ejecutar el SQL**
   - Copia y pega el SQL de arriba
   - Haz clic en **"Run"**

3. **Verificar la Migración**
   - Los campos nuevos estarán disponibles inmediatamente

### 📊 Resultado Esperado

Después de aplicar la migración, los datos se guardarán así:

```json
{
  "id": "uuid",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "phone": "+573001234567",
  "phone_country": "57",
  "cedula": "1234567890",
  "birth_date": "1990-05-15",
  "application_source": "computrabajo",
  "resume_url": "https://...",
  "analysis_summary": "Carta de presentación...",
  "created_at": "2024-09-24T...",
  "updated_at": "2024-09-24T..."
}
```

### 🎯 Funcionalidades Habilitadas

- ✅ **Campos estructurados**: `cedula`, `birth_date`, `application_source`
- ✅ **Búsqueda optimizada**: Índices en campos clave
- ✅ **Datos accesibles**: Campos individuales en lugar de JSON
- ✅ **Integridad**: Validación y constraints apropiadas

### 🧪 Verificación

Después de aplicar la migración:
1. Envía un formulario de postulación
2. Verifica en Supabase Dashboard → Table Editor → candidates
3. Los campos `cedula`, `birth_date`, y `application_source` deben tener valores

### 📁 Archivos Relacionados

- `supabase/migrations/20250924180000_add_candidate_fields.sql` - Migración SQL
- `src/components/candidates/ApplicationForm.tsx` - Formulario actualizado
- `supabase/functions/create-application/index.ts` - Función edge actualizada
- `src/integrations/supabase/types-updated.ts` - Tipos TypeScript actualizados

¡Una vez aplicada la migración, el formulario funcionará perfectamente con todos los campos! 🎉