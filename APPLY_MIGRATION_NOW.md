# 🚨 ACCIÓN REQUERIDA - Aplicar Migración AHORA

## ❌ Problema Actual
Los campos `cedula`, `birth_date`, y `application_source` **NO se están guardando** porque la migración no se ha aplicado a la base de datos.

## ✅ Solución Inmediata

### 1. Ve a Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql

### 2. Ejecuta este SQL exacto:

```sql
-- Agregar campos faltantes a la tabla candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS application_source VARCHAR(50);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_cedula ON candidates(cedula);

-- Comentarios de documentación
COMMENT ON COLUMN candidates.cedula IS 'National ID number of the candidate';
COMMENT ON COLUMN candidates.birth_date IS 'Date of birth of the candidate';
COMMENT ON COLUMN candidates.application_source IS 'How the candidate found the job opportunity';
```

### 3. Haz clic en "Run"

### 4. Verifica que funcionó:
- Ve a **Table Editor** → **candidates**
- Deberías ver las nuevas columnas: `cedula`, `birth_date`, `application_source`

## 🧪 Prueba el Formulario

Después de aplicar la migración:

1. Ve a: `http://localhost:8080/postularse/[JOB_ID]`
2. Llena el formulario completamente
3. Envía la aplicación
4. Verifica en Supabase que los campos se guardaron correctamente

## 📊 Resultado Esperado

Los candidatos ahora se guardarán con campos estructurados:

```json
{
  "id": "uuid",
  "first_name": "Juan",
  "last_name": "Pérez",
  "email": "juan@email.com",
  "phone": "+573001234567",
  "phone_country": "57",
  "cedula": "1234567890",           // ✅ NUEVO
  "birth_date": "1990-05-15",       // ✅ NUEVO
  "application_source": "computrabajo", // ✅ NUEVO
  "resume_url": "https://...",
  "analysis_summary": "Carta de presentación...",
  "created_at": "2024-09-24T...",
  "updated_at": "2024-09-24T..."
}
```

## ⚠️ Importante

**SIN esta migración, los datos se guardarán como JSON en `analysis_summary`, pero NO estarán disponibles como campos individuales para consultas y reportes.**

¡Aplica la migración ahora y el formulario funcionará perfectamente! 🎉