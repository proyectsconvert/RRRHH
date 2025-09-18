# 🚀 Instrucciones de Despliegue

## 📋 **Pasos para Desplegar Todo**

### **1. Desplegar Funciones de Supabase**

#### **Opción A: Dashboard de Supabase (Recomendado)**
1. Ve a [supabase.com](https://supabase.com) → Tu proyecto → **Edge Functions**
2. Crea dos funciones nuevas:

**Función 1: `whatsapp-webhook`**
- Pega el contenido de `supabase/functions/whatsapp-webhook/index.ts`
- Variables de entorno:
  - `SUPABASE_URL`: `https://kugocdtesaczbfrwblsi.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY`: (Obtén de Settings → API → service_role key)

**Función 2: `n8n-proxy`**
- Pega el contenido de `supabase/functions/n8n-proxy/index.ts`
- No necesita variables de entorno adicionales

#### **Opción B: CLI de Supabase**
```bash
# Instalar CLI (si no está instalado)
npm install -g supabase

# Login
supabase login

# Desplegar funciones
supabase functions deploy whatsapp-webhook
supabase functions deploy n8n-proxy
```

### **2. Ejecutar Migraciones de Base de Datos**

Ve a **SQL Editor** en Supabase y ejecuta:
```sql
-- Copia y pega el contenido de setup_whatsapp_integration.sql
```

### **3. Configurar Evolution API**

En tu panel de Evolution API:
- **Webhook URL**: `https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/whatsapp-webhook`
- **Eventos**: `messages`, `message_create`

### **4. Configurar Workflow de N8N**

Usa la documentación en `n8n_workflow_setup.md` para configurar tu workflow.

### **5. Probar la Integración**

1. Ve a tu aplicación → Panel de administración → WhatsApp
2. Haz clic en **"Test N8N Workflow"** en el debug panel
3. Prueba activar/desactivar el bot
4. Envía un mensaje desde WhatsApp real

## ✅ **Verificación Final**

- ✅ Los botones deberían funcionar sin errores de CORS
- ✅ El estado del bot se debería actualizar correctamente
- ✅ Los mensajes de WhatsApp deberían guardarse en la base de datos
- ✅ Los mensajes deberían aparecer en el chat en tiempo real

## 🔧 **Solución de Problemas**

### **Error de CORS**
- ✅ Ya solucionado con el proxy de Supabase

### **Función no encontrada**
- Verifica que las funciones estén desplegadas correctamente
- Revisa los logs en Supabase → Edge Functions

### **Webhook no recibe mensajes**
- Verifica la URL del webhook en Evolution API
- Revisa los logs de la función `whatsapp-webhook`

### **Bot no responde**
- Verifica que el workflow de n8n esté configurado correctamente
- Revisa los logs de la función `n8n-proxy`