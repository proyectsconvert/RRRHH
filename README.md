# 🚀 ConvertIA - Sistema de Gestión RRHH con WhatsApp

Sistema completo de Recursos Humanos con integración de WhatsApp, gestión de usuarios, permisos avanzados y optimización para producción.

## 📋 Características Principales

- ✅ **Gestión de Usuarios y Roles** - Sistema completo de autenticación y permisos
- ✅ **Integración WhatsApp** - Chat en tiempo real con Evolution API
- ✅ **Dashboard Administrativo** - Panel de control completo
- ✅ **Gestión de Candidatos** - Sistema de reclutamiento
- ✅ **Módulos RRHH** - Asistencia, nómina, documentos
- ✅ **Optimización Producción** - Configurado para despliegue
- ✅ **Seguridad Avanzada** - Protección de rutas por permisos

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **WhatsApp**: Evolution API
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **State**: TanStack Query

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+ y npm
- Cuenta de Supabase
- Evolution API configurada
- OpenAI API Key (opcional)

### Instalación

```bash
# Clonar repositorio
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Configuración de Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Evolution API (WhatsApp)
VITE_EVOLUTION_API_URL=https://your-evolution-api.com
VITE_EVOLUTION_API_TOKEN=your-api-token-here
VITE_EVOLUTION_INSTANCE=your-instance-name
VITE_BOT_NUMBER=your-bot-number

# OpenAI (opcional)
OPENAI_API_KEY=your-openai-api-key-here

# Configuración de aplicación
VITE_APP_NAME=ConvertIA
VITE_APP_ENV=development
```

### Configuración de Supabase

1. **Crear proyecto** en [Supabase](https://supabase.com)
2. **Ejecutar migraciones** en SQL Editor:
   ```sql
   -- Ejecutar todos los archivos en supabase/migrations/
   -- En orden: 20250514, 20250615, 20250616, 20250916, 20250917, etc.
   ```
3. **Configurar RLS** (Row Level Security) según sea necesario
4. **Crear funciones** de Supabase en `supabase/functions/`

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos TypeScript
npm run type-check

# Ejecutar linter
npm run lint

# Corregir problemas de linting
npm run lint:fix
```

## 🚀 Despliegue en Producción

### Build Optimizado

```bash
# Build para producción (elimina console.log automáticamente)
npm run build:prod

# Build con análisis de bundle
npm run build:analyze

# Vista previa del build
npm run preview
```

### Opciones de Despliegue

#### 1. Vercel (Recomendado)
```bash
npm i -g vercel
vercel --prod
```

#### 2. Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### 3. Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:prod
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

### Variables de Producción

Crea `.env.production` con:
```env
# Copiar de .env.production.example
# Configurar URLs de producción
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_EVOLUTION_API_URL=https://tu-evolution-api.com
```

### Optimizaciones de Producción

- ✅ **Console.log eliminados** automáticamente en build
- ✅ **Minificación Terser** con compresión avanzada
- ✅ **Code splitting** por módulos
- ✅ **Lazy loading** de componentes
- ✅ **Service worker** opcional
- ✅ **PWA ready** para instalación

## 🔐 Sistema de Seguridad

### Autenticación y Autorización
- ✅ **JWT Authentication** con Supabase Auth
- ✅ **Role-Based Access Control** (RBAC)
- ✅ **Module-Based Permissions** por usuario
- ✅ **Route Protection** automática
- ✅ **Session Management** seguro
- ✅ **Validación de Usuarios Activos/Inactivos**
- ✅ **Bloqueo automático** para cuentas desactivadas

### Módulos Disponibles
- 🏠 **Dashboard** - Panel de control general
- 👥 **Usuarios** - Gestión de usuarios y roles
- 👨‍💼 **Candidatos** - Sistema de reclutamiento
- 📄 **Vacantes** - Gestión de ofertas laborales
- 📊 **Campañas** - Marketing y publicidad
- 💬 **Chatbot** - Asistente virtual
- 📱 **WhatsApp** - Integración de mensajería
- 📈 **Reportes** - Analytics y estadísticas
- ⚙️ **Configuración** - Ajustes del sistema

### Protección de Rutas
Cada módulo tiene protección automática:
```typescript
<ModuleProtectedRoute requiredModule="whatsapp">
  <WhatsApp />
</ModuleProtectedRoute>
```

## 📱 WhatsApp Integration

### Configuración
1. **Evolution API** configurada y activa
2. **Webhook URL** apuntando a `/supabase/functions/whatsapp-webhook`
3. **Instancia conectada** a WhatsApp Business

### Funcionalidades
- ✅ **Mensajes entrantes** guardados automáticamente
- ✅ **Respuestas automáticas** opcionales
- ✅ **Historial completo** de conversaciones
- ✅ **Múltiples usuarios** simultáneos
- ✅ **Debug panel** para troubleshooting

## 🐛 Troubleshooting

### Problemas Comunes

#### Build falla
```bash
npm run clean
npm install
npm run build:prod
```

#### Variables de entorno no cargan
```bash
# Verificar archivo .env existe
ls -la .env

# Reiniciar servidor de desarrollo
npm run dev
```

#### WhatsApp no conecta
- Verificar Evolution API está activa
- Comprobar token y URL
- Revisar logs en Supabase Functions

#### Usuario no puede acceder (cuenta inactiva)
- Verificar estado `is_active` en tabla `profiles`
- Para usuarios admin: activar desde `/admin/users`
- Para usuarios RRHH: contactar administrador
- Mensaje: "Tu cuenta ha sido desactivada. Contacta al administrador"

#### Permisos no funcionan
- Verificar usuario tiene roles asignados
- Comprobar módulos habilitados
- Revisar configuración en base de datos

### Logs y Debugging
```bash
# Ver logs de desarrollo
npm run dev

# Verificar tipos
npm run type-check

# Ejecutar linter
npm run lint
```

## 📊 Rendimiento

### Optimizaciones Implementadas
- ✅ **Tree Shaking** automático
- ✅ **Code Splitting** por rutas
- ✅ **Lazy Loading** de componentes
- ✅ **Bundle Analysis** disponible
- ✅ **Minificación** avanzada
- ✅ **Console.log eliminados** en producción

### Métricas de Build
```bash
npm run build:analyze
# Abre análisis visual del bundle
```

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crear rama** para feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit cambios**: `git commit -m 'Agrega nueva funcionalidad'`
4. **Push**: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico:
- 📧 Email: soporte@convertia.com
- 💬 WhatsApp: +57 300 123 4567
- 📋 Issues: [GitHub Issues](https://github.com/convertia/issues)

---

**ConvertIA** - Potenciando el reclutamiento con IA 🤖
