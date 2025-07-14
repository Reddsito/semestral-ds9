# Sistema de Autenticación con Fastify y Vite

Este proyecto incluye un backend completo con Fastify y TypeScript, y un frontend con Vite y JavaScript, implementando un sistema robusto de autenticación con JWT, Google OAuth, roles y permisos.

## 🏗️ Estructura del Proyecto

```
semestral-ds9/
├── backend/                 # Backend con Fastify + TypeScript
│   ├── src/
│   │   ├── config/         # Configuración de base de datos
│   │   ├── controllers/    # Controladores de la API
│   │   ├── middleware/     # Middlewares de autenticación
│   │   ├── models/         # Modelos de Mongoose
│   │   ├── routes/         # Rutas de la API
│   │   ├── services/       # Lógica de negocio
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Frontend con Vite + JavaScript
│   ├── src/
│   ├── package.json
│   └── index.html
├── docker-compose.yml      # Configuración de MongoDB
└── README.md
```

## 🚀 Características

### Backend (Fastify + TypeScript)

- ✅ **Autenticación JWT** con tokens seguros
- ✅ **Google OAuth** integrado
- ✅ **Sistema de roles** (customer, moderator, admin)
- ✅ **Sistema de permisos** basado en recursos y acciones
- ✅ **Encriptación de contraseñas** con bcrypt
- ✅ **Validación de datos** con esquemas JSON
- ✅ **CORS configurado** para desarrollo
- ✅ **Logging** con Pino
- ✅ **Manejo de errores** global
- ✅ **Base de datos MongoDB** con Docker

### Frontend (Vite + JavaScript)

- ✅ **Configuración Vite** lista para desarrollo
- ✅ **Estructura modular** preparada para expansión

## 🛠️ Tecnologías Utilizadas

### Backend

- **Fastify** - Framework web rápido
- **TypeScript** - Tipado estático
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación stateless
- **bcryptjs** - Encriptación de contraseñas
- **Docker** - Contenedorización de MongoDB

### Frontend

- **Vite** - Build tool moderno
- **JavaScript** - Lenguaje de programación
- **Vanilla JS** - Sin frameworks adicionales

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- Docker y Docker Compose
- npm o yarn

## 🚀 Instalación y Configuración

### 1. Clonar y configurar el proyecto

```bash
# Navegar al directorio del proyecto
cd semestral-ds9

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Configurar variables de entorno

```bash
# En el directorio backend
cp env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://app_user:app_password@localhost:27017/auth_db?authSource=auth_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Iniciar MongoDB con Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

### 4. Iniciar el backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### 5. Iniciar el frontend

```bash
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 📚 API Endpoints

### Autenticación

| Método | Endpoint                | Descripción                      |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/auth/register`        | Registrar nuevo usuario          |
| POST   | `/auth/login`           | Iniciar sesión                   |
| GET    | `/auth/profile`         | Obtener perfil del usuario       |
| POST   | `/auth/google/callback` | Callback de Google OAuth         |
| GET    | `/auth/verify`          | Verificar token JWT              |
| POST   | `/auth/logout`          | Cerrar sesión                    |
| GET    | `/auth/admin`           | Área administrativa (solo admin) |

### Otros

| Método | Endpoint  | Descripción           |
| ------ | --------- | --------------------- |
| GET    | `/health` | Estado del servidor   |
| GET    | `/`       | Información de la API |

## 🔐 Sistema de Roles y Permisos

### Roles Disponibles

1. **customer** - Usuario básico

   - Permisos: Leer información de usuarios

2. **moderator** - Moderador

   - Permisos: Leer y escribir información de usuarios

3. **admin** - Administrador
   - Permisos: Acceso completo a todas las funcionalidades

### Usuario por Defecto

Se crea automáticamente un usuario administrador:

- **Email**: admin@example.com
- **Contraseña**: admin123
- **Rol**: admin

## 🧪 Ejemplos de Uso

### Registrar un usuario

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "123456",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

### Iniciar sesión

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "123456"
  }'
```

### Obtener perfil (requiere token)

```bash
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Scripts Disponibles

### Backend

```bash
npm run dev      # Desarrollo con nodemon
npm run build    # Compilar TypeScript
npm run start    # Producción
```

### Frontend

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 🐳 Docker

### Iniciar MongoDB

```bash
docker-compose up -d
```

### Ver logs de MongoDB

```bash
docker-compose logs mongodb
```

### Detener MongoDB

```bash
docker-compose down
```

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ JWT tokens seguros
- ✅ Validación de datos en entrada
- ✅ CORS configurado
- ✅ Middleware de autenticación
- ✅ Sistema de roles y permisos
- ✅ Manejo seguro de errores

## 📝 Notas de Desarrollo

### Estructura de Base de Datos

- **users**: Información de usuarios
- **roles**: Roles del sistema
- **permissions**: Permisos disponibles

### Middleware de Autenticación

- `authenticateToken`: Verifica JWT token
- `requireRole`: Verifica roles específicos
- `requireAdmin`: Solo para administradores
- `requireModerator`: Para moderadores y admins

### Configuración de Google OAuth

Para usar Google OAuth, necesitas:

1. Crear un proyecto en Google Cloud Console
2. Habilitar Google+ API
3. Crear credenciales OAuth 2.0
4. Configurar las URLs de redirección
5. Actualizar las variables de entorno

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Verifica los logs del servidor
3. Asegúrate de que MongoDB esté corriendo
4. Verifica las variables de entorno

---

**¡Disfruta desarrollando! 🚀**
