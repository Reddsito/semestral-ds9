# 🔐 Sistema de Autenticación Full-Stack

Un sistema completo de autenticación con **Fastify** (JavaScript) en el backend y **Vite** (JavaScript) en el frontend, con **MongoDB**, **JWT**, **OAuth con Google**, y **caching local**.

## 🚀 Características

### Backend (Fastify + JavaScript)

- ✅ **Fastify** como framework web
- ✅ **MongoDB** con Mongoose para base de datos
- ✅ **JWT** para autenticación
- ✅ **OAuth 2.0** con Google
- ✅ **Caching local** con @fastify/caching
- ✅ **Validación** con esquemas personalizados
- ✅ **Logs bonitos** con pino-pretty
- ✅ **CORS** configurado
- ✅ **Manejo de errores** global
- ✅ **Respuestas estandarizadas**

### Frontend (Vite + JavaScript)

- ✅ **Vite** para desarrollo rápido
- ✅ **JavaScript vanilla** (sin frameworks)
- ✅ **Autenticación** con credenciales
- ✅ **OAuth con Google** integrado
- ✅ **Gestión de sesiones** con localStorage
- ✅ **UI moderna** y responsive
- ✅ **Navegación** entre páginas

## 📁 Estructura del Proyecto

```
semestral-ds9/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validationErrorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Role.js
│   │   │   └── Permission.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── cacheService.js
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   ├── responseHelper.js
│   │   │   └── initData.js
│   │   ├── validations/
│   │   │   ├── authValidations.js
│   │   │   ├── commonValidations.js
│   │   │   └── index.js
│   │   └── index.js
│   ├── package.json
│   ├── nodemon.json
│   └── env.example
├── frontend/
│   ├── src/
│   │   ├── auth.js
│   │   ├── login.js
│   │   └── profile.js
│   ├── index.html
│   ├── login.html
│   ├── profile.html
│   ├── style.css
│   └── package.json
├── docker-compose.yml
├── mongo-init.js
└── README.md
```

## 🛠️ Tecnologías

### Backend

- **Fastify** - Framework web rápido
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - JSON Web Tokens
- **bcryptjs** - Hash de contraseñas
- **@fastify/caching** - Caching local
- **@fastify/cors** - CORS
- **@fastify/jwt** - JWT plugin
- **@fastify/oauth2** - OAuth2 plugin
- **pino-pretty** - Logs bonitos
- **dotenv** - Variables de entorno

### Frontend

- **Vite** - Build tool y dev server
- **JavaScript vanilla** - Sin frameworks
- **CSS** - Estilos personalizados

### DevOps

- **Docker Compose** - Orquestación de servicios
- **MongoDB** - Base de datos
- **Mongo Express** - UI para MongoDB

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd semestral-ds9
```

### 2. Configurar variables de entorno

```bash
# Backend
cd backend
cp env.example .env
```

Editar `backend/.env`:

```bash
# Configuración del servidor
PORT=3001
NODE_ENV=development

# Base de datos MongoDB
MONGODB_URI=mongodb://app_user:app_password@localhost:27017/auth_db?authSource=auth_db

# JWT
JWT_SECRET=tu-secreto-jwt-super-seguro-aqui-cambialo-en-produccion
JWT_EXPIRES_IN=7d

# Google OAuth2 - REEMPLAZA CON TUS CREDENCIALES REALES
GOOGLE_CLIENT_ID=tu-google-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-google-client-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Configurar Google OAuth2

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto y habilita Google+ API
3. Crea credenciales OAuth 2.0
4. Configura las URLs de redirección:
   - **Authorized JavaScript origins**: `http://localhost:3001`
   - **Authorized redirect URIs**: `http://localhost:3001/auth/google/callback`

### 4. Instalar dependencias

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm

# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

### 5. Iniciar servicios

```bash
# Iniciar MongoDB y Mongo Express
docker-compose up -d

# Backend (en una terminal)
cd backend
pnpm dev

# Frontend (en otra terminal)
cd frontend
pnpm dev
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MongoDB**: mongodb://localhost:27017
- **Mongo Express**: http://localhost:8080 (admin/admin123)

## 🔐 Endpoints de la API

### Autenticación

- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión
- `GET /auth/google` - Iniciar OAuth con Google
- `GET /auth/google/callback` - Callback de Google OAuth
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/verify` - Verificar token
- `GET /auth/profile` - Obtener perfil (requiere auth)
- `PUT /auth/profile` - Actualizar perfil (requiere auth)
- `POST /auth/change-password` - Cambiar contraseña (requiere auth)

### Utilidades

- `GET /health` - Estado del servidor
- `GET /cache/test` - Probar cache

## 🔧 Configuración de Desarrollo

### Backend

```bash
cd backend
pnpm dev  # Inicia con nodemon
```

### Frontend

```bash
cd frontend
pnpm dev  # Inicia servidor de desarrollo
```

### Base de Datos

```bash
# Iniciar MongoDB
docker-compose up -d

# Ver logs
docker-compose logs -f mongodb
```

## 📊 Características del Sistema

### Autenticación

- **Registro** con email, contraseña, nombre y apellido
- **Login** con credenciales
- **OAuth con Google** completo
- **JWT** para sesiones
- **Middleware de autenticación** para rutas protegidas

### Caching

- **Cache local** con @fastify/caching
- **Cache de usuarios** por ID y email
- **Invalidación automática** al actualizar datos

### Validación

- **Esquemas de validación** separados
- **Manejo de errores** personalizado
- **Respuestas estandarizadas** con formato consistente

### Seguridad

- **Hash de contraseñas** con bcrypt
- **JWT** con expiración configurable
- **CORS** configurado
- **Validación de entrada** en todos los endpoints

## 🎨 Frontend

### Páginas

- **Login/Register** - Formulario dual con OAuth
- **Profile** - Información del usuario autenticado
- **Navegación** - Sistema de rutas simple

### Características

- **UI moderna** con CSS personalizado
- **Responsive design**
- **Gestión de estado** con localStorage
- **Integración completa** con backend

## 🔍 Debugging

### Logs del Backend

```bash
# Ver logs en tiempo real
cd backend
pnpm dev
```

### Base de Datos

```bash
# Acceder a MongoDB
docker exec -it mongodb mongosh -u app_user -p app_password auth_db

# Ver datos
db.users.find()
```

### Cache

```bash
# Probar cache
curl http://localhost:3001/cache/test
```

## 🚀 Producción

### Variables de Entorno

```bash
NODE_ENV=production
JWT_SECRET=secreto-super-seguro-de-produccion
GOOGLE_CLIENT_ID=tu-client-id-de-produccion
GOOGLE_CLIENT_SECRET=tu-client-secret-de-produccion
GOOGLE_CALLBACK_URL=https://tu-dominio.com/auth/google/callback
CORS_ORIGIN=https://tu-frontend.com
```

### Build

```bash
# Frontend
cd frontend
pnpm build

# Backend
cd backend
pnpm start
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 🆘 Soporte

Si tienes problemas:

1. Verifica que todas las dependencias estén instaladas
2. Asegúrate de que MongoDB esté corriendo
3. Revisa los logs del backend
4. Verifica la configuración de Google OAuth2
5. Comprueba que las variables de entorno estén correctas
