# 🚨 ACCIÓN REQUERIDA - Corrección de Base de Datos

Parece que faltan algunas columnas en tu base de datos (específicamente `meeting_date`), lo que impide que las reuniones se carguen. Esto puede suceder si una migración anterior no se ejecutó.

Para solucionarlo, por favor ejecuta el siguiente script SQL **completo** en tu Supabase Dashboard. Este script verifica si las columnas existen y las crea solo si faltan, cubriendo tanto los requisitos antiguos como los nuevos.

## 📝 Instrucciones

### 1. Ve a Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/[TU_PROJECT_ID]/sql

### 2. Ejecuta este SQL CONSOLIDADO:

```sql
DO $$
BEGIN
    -- 1. Agregar columnas básicas de agenda (si no existen)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_date') THEN
        ALTER TABLE applications ADD COLUMN meeting_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_time') THEN
        ALTER TABLE applications ADD COLUMN meeting_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_link') THEN
        ALTER TABLE applications ADD COLUMN meeting_link TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_title') THEN
        ALTER TABLE applications ADD COLUMN meeting_title TEXT;
    END IF;

    -- 2. Agregar nuevas columnas de detalles (si no existen)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_modality') THEN
        ALTER TABLE applications ADD COLUMN meeting_modality TEXT CHECK (meeting_modality IN ('virtual', 'presencial'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_address') THEN
        ALTER TABLE applications ADD COLUMN meeting_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_notes') THEN
        ALTER TABLE applications ADD COLUMN meeting_notes TEXT;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'meeting_status') THEN
        ALTER TABLE applications ADD COLUMN meeting_status TEXT DEFAULT 'scheduled';
    END IF;

END $$;

-- Comentarios (opcional, ayuda a documentar)
COMMENT ON COLUMN applications.meeting_date IS 'Scheduled date for the interview meeting';
COMMENT ON COLUMN applications.meeting_time IS 'Scheduled time for the interview meeting';
COMMENT ON COLUMN applications.meeting_link IS 'Teams meeting link for the interview';
COMMENT ON COLUMN applications.meeting_title IS 'Title of the scheduled meeting';
COMMENT ON COLUMN applications.meeting_modality IS 'Modality of the meeting: virtual or presencial';
COMMENT ON COLUMN applications.meeting_address IS 'Physical address for presencial meetings';
COMMENT ON COLUMN applications.meeting_notes IS 'Notes or novelties regarding the meeting';
COMMENT ON COLUMN applications.meeting_status IS 'Status of the meeting: scheduled, completed, cancelled, rescheduled';
```

### 3. Haz clic en "Run"

Después de ejecutar esto, vuelve a cargar la página de "Reuniones" y el error debería desaparecer.
