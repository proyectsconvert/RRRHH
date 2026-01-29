# 🚨 ACCIÓN REQUERIDA - Parte 2: Completar la Migración

## ❌ El Nuevo Problema
Has agregado `status` y `feedback`, ¡bien hecho! Pero ahora el sistema te dice que falta `needs_reupload`. Esto es porque el sistema también intenta marcar el documento para "re-carga" cuando se rechaza.

## ✅ La Solución Definitiva

### 1. Ve a Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/_/sql

### 2. Ejecuta este código SQL (Es seguro ejecutarlo aunque ya hayas corrido el anterior):

```sql
-- 1. Asegurar que existen status y feedback
ALTER TABLE candidate_documents
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 2. AGREGAR LAS COLUMNAS FALTANTES PARA RE-CARGA (Esto es lo nuevo que necesitas)
ALTER TABLE candidate_documents
ADD COLUMN IF NOT EXISTS needs_reupload BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reupload_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reupload_requested_by TEXT;

-- 3. Restricción de estado (si no la tienes aún)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_document_status') THEN
        ALTER TABLE candidate_documents
        ADD CONSTRAINT check_document_status CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;
```

### 3. Haz clic en "Run"

### 4. Prueba Final
Ahora sí, el sistema tendrá TODOS los campos necesarios (`status`, `feedback`, `needs_reupload`, etc.) y debería dejarte aprobar o rechazar sin errores.
