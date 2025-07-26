# 🖨️ Calculadora de Impresión 3D

Sistema completo para cotización de impresiones 3D con análisis automático de archivos STL/OBJ, cálculo de precios en tiempo real y gestión de pedidos.

## 📋 Tabla de Contenidos

- [Arquitectura General](#arquitectura-general)
- [Backend](#backend)
  - [Servicios](#servicios)
  - [Controladores](#controladores)
  - [Modelos de Base de Datos](#modelos-de-base-de-datos)
  - [Rutas API](#rutas-api)
  - [Middleware](#middleware)
- [Frontend](#frontend)
  - [Componentes](#componentes)
  - [Servicios](#servicios-frontend)
  - [Estado](#estado)
- [Infraestructura](#infraestructura)
  - [Docker](#docker)
  - [MinIO](#minio)
  - [MongoDB](#mongodb)
- [Instalación y Uso](#instalación-y-uso)
- [API Reference](#api-reference)

## 🏗️ Arquitectura General

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Storage       │
│   (Web App)     │◄──►│   (Fastify)     │◄──►│   (MinIO/Mongo) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Services      │    │   File Storage  │
│   - Calculator  │    │   - Quote       │    │   - MinIO       │
│   - Auth        │    │   - File        │    │   - MongoDB     │
│   - Router      │    │   - Storage     │    │   - Analysis    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Backend

### Servicios

#### `QuoteService` (`src/services/quoteService.js`)

**Responsabilidad:** Cálculo de cotizaciones y precios

```javascript
class QuoteService {
  // Calcula cotización completa
  async calculateQuote(fileData, materialId, finishId, quantity)

  // Calcula peso basado en volumen y material
  calculateWeight(volumeInCm3, materialName)

  // Calcula costo del material
  calculateMaterialCost(weightInGrams, pricePerGram)

  // Calcula costo del acabado
  calculateFinishCost(materialCost, priceMultiplier)

  // Calcula costo de envío
  calculateShippingCost(weightInGrams)
}
```

**Fórmulas de Cálculo:**

- **Peso:** `volumen(cm³) × densidad(g/cm³)`
- **Costo Material:** `peso(g) × precioPorGramo($)`
- **Costo Acabado:** `costoMaterial × multiplicadorAcabado`
- **Envío:** `costoBase + (peso × factor)`
- **Total:** `subtotal + IVA(12%)`

#### `FileAnalysisService` (`src/services/fileAnalysisService.js`)

**Responsabilidad:** Análisis de archivos 3D

```javascript
class FileAnalysisService {
  // Analiza archivo STL/OBJ
  async analyzeFile(filePath, fileType)

  // Calcula volumen usando Monte Carlo
  calculateVolume(geometry)

  // Calcula dimensiones del modelo
  calculateDimensions(geometry)

  // Valida el modelo
  validateModel(geometry)
}
```

**Análisis Realizado:**

- **Volumen:** Método Monte Carlo (10,000 puntos de muestra)
- **Dimensiones:** Bounding box (ancho × alto × profundidad)
- **Validación:** Geometría válida, tamaños mínimos/máximos

#### `StorageService` (`src/services/storageService.js`)

**Responsabilidad:** Gestión de archivos en MinIO

```javascript
class StorageService {
  // Sube archivo a MinIO
  async uploadFile(file, userId)

  // Descarga archivo de MinIO
  async downloadFile(fileKey, localPath)

  // Genera URL temporal
  async getSignedUrl(fileKey, expiresIn)

  // Elimina archivo
  async deleteFile(fileKey)
}
```

### Controladores

#### `QuoteController` (`src/controllers/quoteController.js`)

**Endpoints:**

- `POST /api/v1/quote/calculate` - Calcula cotización
- `GET /api/v1/quote/materials` - Lista materiales
- `GET /api/v1/quote/finishes` - Lista acabados
- `GET /api/v1/quote/breakdown/:orderId` - Desglose de pedido

#### `FileController` (`src/controllers/fileController.js`)

**Endpoints:**

- `POST /api/v1/files/upload` - Sube archivo
- `GET /api/v1/files/user` - Lista archivos del usuario
- `GET /api/v1/files/:fileId` - Obtiene archivo específico
- `POST /api/v1/files/:fileId/validate` - Valida archivo
- `DELETE /api/v1/files/:fileId` - Elimina archivo

#### `AuthController` (`src/controllers/authController.js`)

**Endpoints:**

- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Información del usuario
- `POST /api/v1/auth/logout` - Logout

### Modelos de Base de Datos

#### `User` (`src/models/User.js`)

```javascript
{
  email: String,
  password: String (hasheada),
  role: String (customer/moderator/admin),
  isActive: Boolean
}
```

#### `File` (`src/models/File.js`)

```javascript
{
  userId: ObjectId,
  originalName: String,
  filename: String,
  filePath: String, // Ruta en MinIO
  fileSize: Number,
  mimeType: String,
  volume: Number, // cm³
  dimensions: {
    width: Number, // mm
    height: Number,
    depth: Number
  },
  isValid: Boolean,
  validationErrors: [String]
}
```

#### `Material` (`src/models/Material.js`)

```javascript
{
  name: String,
  description: String,
  pricePerGram: Number,
  color: String,
  isActive: Boolean
}
```

#### `Finish` (`src/models/Finish.js`)

```javascript
{
  name: String,
  description: String,
  priceMultiplier: Number,
  isActive: Boolean
}
```

#### `Order` (`src/models/Order.js`)

```javascript
{
  userId: ObjectId,
  fileId: ObjectId,
  materialId: ObjectId,
  finishId: ObjectId,
  quantity: Number,
  status: String,
  totalPrice: Number,
  priceBreakdownId: ObjectId,
  deliveryAddress: Object,
  paymentStatus: String
}
```

#### `PriceBreakdown` (`src/models/PriceBreakdown.js`)

```javascript
{
  orderId: ObjectId,
  materialCost: {
    pricePerGram: Number,
    weight: Number,
    total: Number
  },
  finishCost: {
    basePrice: Number,
    multiplier: Number,
    total: Number
  },
  shippingCost: Number,
  subtotal: Number,
  tax: Number,
  total: Number
}
```

### Rutas API

#### Autenticación (`/api/v1/auth`)

```javascript
// Registro
POST /api/v1/auth/register
Body: { email, password, confirmPassword }

// Login
POST /api/v1/auth/login
Body: { email, password }

// Información del usuario
GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
```

#### Archivos (`/api/v1/files`)

```javascript
// Subir archivo
POST /api/v1/files/upload
Headers: Authorization: Bearer <token>
Body: FormData (file)

// Listar archivos del usuario
GET /api/v1/files/user
Headers: Authorization: Bearer <token>

// Validar archivo
POST /api/v1/files/:fileId/validate
Headers: Authorization: Bearer <token>
```

#### Cotizaciones (`/api/v1/quote`)

```javascript
// Calcular cotización
POST /api/v1/quote/calculate
Headers: Authorization: Bearer <token>
Body: { fileId, materialId, finishId, quantity }

// Obtener materiales
GET /api/v1/quote/materials

// Obtener acabados
GET /api/v1/quote/finishes
```

### Middleware

#### `authenticateToken` (`src/middleware/auth.js`)

Verifica JWT token y agrega `request.user`

#### `requireRole` (`src/middleware/auth.js`)

Verifica que el usuario tenga el rol requerido

#### `validationErrorHandler` (`src/middleware/validationErrorHandler.js`)

Maneja errores de validación de forma consistente

## 🎨 Frontend

### Componentes

#### `CalculatorComponent` (`public/components/CalculatorComponent.js`)

**Responsabilidad:** Interfaz principal de la calculadora

**Funcionalidades:**

- Drag & drop de archivos
- Selección de materiales/acabados
- Cálculo de cotizaciones
- Visualización de resultados

**Métodos Principales:**

```javascript
// Carga materiales y acabados
async loadMaterials()
async loadFinishes()

// Maneja subida de archivos
handleFileSelect(file)
async calculateQuote()

// Actualiza UI
updateFileInfo()
displayQuote()
```

#### `AuthComponent` (`public/components/AuthComponent.js`)

**Responsabilidad:** Autenticación de usuarios

#### `NavbarComponent` (`public/components/NavbarComponent.js`)

**Responsabilidad:** Navegación principal

#### `Toast` (`public/components/Toast.js`)

**Responsabilidad:** Notificaciones elegantes

```javascript
Toast.success("Operación exitosa");
Toast.error("Error en la operación");
Toast.warning("Advertencia");
Toast.info("Información");
```

### Servicios Frontend

#### `API` (`public/services/api.js`)

Cliente HTTP para comunicación con el backend

#### `Router` (`public/services/router.js`)

Sistema de rutas del lado del cliente

#### `AuthStore` (`public/stores/authStore.js`)

Gestión de estado de autenticación

### Estado

#### `AuthStore`

```javascript
{
  isAuthenticated: Boolean,
  user: Object,
  token: String,
  isLoading: Boolean,
  error: String
}
```

#### `RouteStore`

```javascript
{
  currentRoute: String,
  params: Object
}
```

## 🐳 Infraestructura

### Docker

#### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    ports: ["3001:3001"]
    depends_on: [mongodb, minio]

  mongodb:
    image: mongo:latest
    ports: ["27017:27017"]

  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]

  mongo-express:
    image: mongo-express:latest
    ports: ["8080:8081"]
```

### MinIO

**Configuración:**

- **Endpoint:** `localhost:9000`
- **Console:** `localhost:9001`
- **Credentials:** `minioadmin` / `minioadmin123`
- **Bucket:** `3d-prints`

**Uso:**

```javascript
// Subir archivo
await storageService.uploadFile(file, userId);

// Descargar archivo
await storageService.downloadFile(fileKey, localPath);

// Generar URL temporal
await storageService.getSignedUrl(fileKey);
```

### MongoDB

**Colecciones:**

- `users` - Usuarios del sistema
- `files` - Archivos 3D subidos
- `materials` - Materiales disponibles
- `finishes` - Acabados disponibles
- `orders` - Pedidos realizados
- `pricebreakdowns` - Desgloses de precios

**Índices:**

```javascript
// Users
{
	email: 1;
} // Único
{
	role: 1;
}

// Files
{
	userId: 1;
}
{
	filename: 1;
}
{
	isValid: 1;
}

// Materials/Finishes
{
	name: 1;
} // Único
{
	isActive: 1;
}
```

## 🚀 Instalación y Uso

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- pnpm (recomendado)

### Instalación

1. **Clonar repositorio**

```bash
git clone <repository-url>
cd semestral-ds9
```

2. **Instalar dependencias**

```bash
pnpm install
```

3. **Configurar variables de entorno**

```bash
cp env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar servicios**

```bash
docker-compose up -d
```

5. **Inicializar base de datos**

```bash
pnpm run init-db
```

6. **Iniciar aplicación**

```bash
pnpm start
```

### Uso

1. **Acceder a la aplicación**

   - URL: `http://localhost:3001`
   - Registrarse o iniciar sesión

2. **Usar la calculadora**

   - Ir a `/calculator`
   - Subir archivo STL/OBJ
   - Seleccionar material y acabado
   - Ver cotización en tiempo real

3. **Panel de administración**
   - MinIO Console: `http://localhost:9001`
   - Mongo Express: `http://localhost:8080`

## 📚 API Reference

### Respuestas Estándar

**Éxito:**

```javascript
{
  success: true,
  message: "Operación exitosa",
  result: {
    data: { /* datos */ },
    extra: { /* datos adicionales */ }
  }
}
```

**Error:**

```javascript
{
  success: false,
  message: "Descripción del error",
  result: {
    data: { /* detalles del error */ },
    extra: { /* información adicional */ }
  }
}
```

### Autenticación

**Headers requeridos:**

```javascript
{
  "Authorization": "Bearer <jwt-token>",
  "Content-Type": "application/json"
}
```

### Códigos de Estado

- `200` - Éxito
- `201` - Creado
- `400` - Error de validación
- `401` - No autenticado
- `403` - Sin permisos
- `404` - No encontrado
- `500` - Error del servidor

## 🔧 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev          # Modo desarrollo con hot reload
pnpm start        # Modo producción
pnpm test         # Ejecutar tests

# Base de datos
pnpm init-db      # Inicializar datos por defecto
pnpm reset-db     # Resetear base de datos

# Docker
docker-compose up -d    # Iniciar servicios
docker-compose down     # Detener servicios
docker-compose logs     # Ver logs
```

### Estructura de Archivos

```
semestral-ds9/
├── src/
│   ├── config/          # Configuraciones
│   ├── controllers/     # Controladores API
│   ├── middleware/      # Middleware
│   ├── models/         # Modelos MongoDB
│   ├── routes/         # Definición de rutas
│   ├── services/       # Lógica de negocio
│   ├── utils/          # Utilidades
│   └── index.js        # Punto de entrada
├── public/
│   ├── components/     # Web Components
│   ├── services/       # Servicios frontend
│   ├── stores/         # Estado global
│   ├── styles/         # CSS
│   └── index.html      # Página principal
├── docker-compose.yml  # Servicios Docker
└── package.json        # Dependencias
```

## 🎯 Características Destacadas

### ✅ Implementado

- ✅ Análisis real de archivos 3D (Three.js)
- ✅ Cálculo preciso de volumen (Monte Carlo)
- ✅ Sistema de precios dinámico
- ✅ Autenticación JWT
- ✅ Almacenamiento S3-compatible
- ✅ Interfaz responsive
- ✅ Notificaciones elegantes
- ✅ Validación en tiempo real

### 🚧 Próximamente

- 📋 Gestión de pedidos
- 💳 Integración de pagos
- 📊 Dashboard de administración
- 📧 Notificaciones por email
- 🔄 Historial de cotizaciones
- 📱 Aplicación móvil

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para la impresión 3D**
