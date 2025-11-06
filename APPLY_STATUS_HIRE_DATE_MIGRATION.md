# 🚨 ACCIÓN REQUERIDA - Aplicar Migración de Status y Hire Date

## ❌ Problema Actual
Los campos `status` y `hire_date` **NO se están guardando** en la tabla `candidates` porque la migración no se ha aplicado a la base de datos.

## ✅ Solución Inmediata

### 1. Ve a Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql

### 2. Ejecuta este SQL exacto:

```sql
-- Add status and hire_date columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add hire_date column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN candidates.status IS 'Current status of the candidate (e.g., contratado, proceso-contratacion, etc.)';
COMMENT ON COLUMN candidates.hire_date IS 'Date when the candidate was hired';
COMMENT ON COLUMN applications.hire_date IS 'Date when this specific application was hired';

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
```

### 3. Haz clic en "Run"

### 4. Verifica que funcionó:
- Ve a **Table Editor** → **candidates**
- Deberías ver las nuevas columnas: `status`, `hire_date`

## 🧪 Prueba el Botón "Contratar"

Después de aplicar la migración:

1. Ve a la aplicación: `http://localhost:8083`
2. Ve a **Candidatos** → selecciona un candidato
3. El candidato debe estar en estado "proceso-contratacion"
4. Haz clic en el botón **"Contratar"**
5. Selecciona una fecha de inicio
6. Confirma la contratación
7. Verifica en Supabase que el campo `status` cambió a "contratado" y `hire_date` tiene la fecha seleccionada

## 📊 Resultado Esperado

Los candidatos ahora se guardarán con campos estructurados:

```json
{
  "id": "uuid",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "phone": "+573001234567",
  "status": "contratado",
  "hire_date": "2024-11-06",
  "created_at": "2024-09-24T...",
  "updated_at": "2024-09-24T..."
}
```

## ⚠️ Importante

**SIN esta migración, el botón "Contratar" no podrá actualizar el status del candidato en la base de datos.**

¡Aplica la migración ahora y el botón "Contratar" funcionará perfectamente! 🎉