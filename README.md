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

### Servicios Backend Adicionales

#### `CleanupService` (`src/services/cleanupService.js`)

**Responsabilidad:** Limpieza automática de archivos y datos temporales

```javascript
class CleanupService {
  // Limpiar archivos temporales
  static async cleanupTempFiles()

  // Limpiar archivos de usuario específico
  static async cleanupUserFiles(userId)

  // Limpiar cotizaciones expiradas
  static async cleanupExpiredQuotes()

  // Limpieza programada
  static async scheduledCleanup()
}
```

#### `UserService` (`src/services/userService.js`)

**Responsabilidad:** Gestión de usuarios

```javascript
class UserService {
  // Obtener usuarios con filtros
  async getUsers(filters, pagination)

  // Obtener usuario por ID
  async getUserById(userId)

  // Actualizar estado de usuario
  async toggleUserStatus(userId)

  // Obtener estadísticas de usuario
  async getUserStats(userId)
}
```

#### `OrderService` (`src/services/orderService.js`)

**Responsabilidad:** Gestión completa de pedidos

```javascript
class OrderService {
  // Crear pedido
  async createOrder(orderData, userId)

  // Obtener pedidos con filtros
  async getOrders(filters, pagination)

  // Actualizar pedido
  async updateOrder(orderId, updateData)

  // Actualizar estado
  async updateOrderStatus(orderId, status)

  // Eliminar pedido
  async removeOrder(orderId, user)

  // Validar pedido
  async validateOrder(orderData)
}
```

#### `StripeService` (`src/services/stripeService.js`)

**Responsabilidad:** Integración con Stripe para pagos

```javascript
class StripeService {
  // Crear sesión de checkout
  async createCheckoutSession(orderData)

  // Procesar webhook de Stripe
  async handleWebhook(event)

  // Verificar estado de pago
  async verifyPaymentStatus(sessionId)

  // Procesar reembolso
  async processRefund(paymentIntentId)
}
```

#### `CacheService` (`src/services/cacheService.js`)

**Responsabilidad:** Sistema de caché para optimización

```javascript
class CacheService {
  // Cache de usuarios
  setUser(userId, user)
  getUser(userId)
  setUserByEmail(email, user)
  getUserByEmail(email)

  // Cache de Google OAuth
  setUserByGoogleId(googleId, user)
  getUserByGoogleId(googleId)

  // Invalidación de cache
  invalidateUser(userId)
  invalidateUserByEmail(email)

  // Verificaciones
  async isUserActive(userId)
  async isUserValid(userId)

  // Limpieza
  flush()
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

- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `GET /api/v1/auth/profile` - Obtener perfil del usuario
- `GET /api/v1/auth/me` - Obtener usuario por token
- `GET /api/v1/auth/verify` - Verificar token
- `GET /api/v1/auth/google/callback` - Callback de Google OAuth
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/change-password` - Cambiar contraseña
- `PUT /api/v1/auth/profile` - Actualizar perfil
- `POST /api/v1/auth/avatar/upload` - Subir avatar
- `DELETE /api/v1/auth/avatar` - Eliminar avatar
- `GET /api/v1/auth/avatar/signed-url` - Obtener URL firmada del avatar
- `GET /api/v1/auth/admin` - Área administrativa (solo admin)

#### `FileController` (`src/controllers/fileController.js`)

**Endpoints:**

- `POST /api/v1/files/upload` - Subir archivo 3D
- `POST /api/v1/files/upload-image` - Subir imagen
- `GET /api/v1/files/user` - Listar archivos del usuario
- `GET /api/v1/files/:fileId` - Obtener archivo específico
- `DELETE /api/v1/files/:fileId` - Eliminar archivo

#### `QuoteManagementController` (`src/controllers/quoteManagementController.js`)

**Endpoints:**

- `POST /api/v1/quotes/save` - Guardar cotización
- `GET /api/v1/quotes/user` - Obtener cotizaciones del usuario
- `GET /api/v1/quotes/:quoteId` - Obtener cotización específica
- `DELETE /api/v1/quotes/:quoteId` - Eliminar cotización
- `GET /api/v1/quotes/admin/all` - Obtener todas las cotizaciones (admin)
- `GET /api/v1/quotes/admin/stats` - Estadísticas de cotizaciones (admin)
- `POST /api/v1/quotes/admin/cleanup` - Limpiar cotizaciones expiradas (admin)

#### `OrderController` (`src/controllers/orderController.js`)

**Endpoints:**

- `GET /api/v1/orders` - Obtener pedidos del usuario
- `GET /api/v1/orders/:id` - Obtener pedido específico
- `GET /api/v1/orders/user/:id` - Obtener pedidos por usuario
- `GET /api/v1/orders/statuses` - Obtener estados válidos
- `POST /api/v1/orders` - Crear nuevo pedido
- `PUT /api/v1/orders/:id` - Actualizar pedido
- `PATCH /api/v1/orders/:id/status` - Actualizar estado (admin)
- `DELETE /api/v1/orders/:id` - Eliminar pedido
- `GET /api/v1/orders/admin` - Obtener todos los pedidos (admin)

#### `AddressController` (`src/controllers/addressController.js`)

**Endpoints:**

- `GET /api/v1/addresses` - Obtener direcciones del usuario
- `GET /api/v1/addresses/default` - Obtener dirección predeterminada
- `GET /api/v1/addresses/:id` - Obtener dirección específica
- `POST /api/v1/addresses` - Crear nueva dirección
- `PUT /api/v1/addresses/:id` - Actualizar dirección
- `PUT /api/v1/addresses/:id/default` - Establecer como predeterminada
- `DELETE /api/v1/addresses/:id` - Eliminar dirección

#### `AdminController` (`src/controllers/adminController.js`)

**Endpoints:**

- `GET /api/v1/admin/stats` - Estadísticas del sistema
- `GET /api/v1/admin/chart-data` - Datos para gráficos
- `POST /api/v1/admin/cleanup` - Limpiar archivos temporales
- `GET /api/v1/admin/temp-files` - Listar archivos temporales
- `GET /api/v1/admin/files/:status` - Listar archivos por estado
- `DELETE /api/v1/admin/files/:fileId` - Eliminar archivo
- `DELETE /api/v1/admin/files/bulk-delete` - Eliminación masiva
- `POST /api/v1/admin/users/:userId/cleanup` - Limpiar archivos de usuario
- `GET /api/v1/admin/users` - Gestión de usuarios
- `GET /api/v1/admin/users/:userId` - Obtener usuario específico
- `PATCH /api/v1/admin/users/:userId/toggle-active` - Cambiar estado de usuario

#### `StripeController` (`src/controllers/stripeController.js`)

**Endpoints:**

- `POST /api/v1/stripe/checkout-session` - Crear sesión de checkout
- `GET /api/v1/stripe/checkout-session/:sessionId` - Obtener sesión de checkout

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

#### `Address` (`src/models/Address.js`)

```javascript
{
  userId: ObjectId,           // Usuario propietario
  name: String,              // Nombre descriptivo de la dirección
  phone: String,             // Teléfono de contacto
  notes: String,             // Notas adicionales
  coordinates: {
    lat: Number,             // Latitud
    lng: Number              // Longitud
  },
  isDefault: Boolean,        // Dirección predeterminada
  createdAt: Date,
  updatedAt: Date
}
```

#### `Quote` (`src/models/Quote.js`)

```javascript
{
  userId: ObjectId,           // Usuario que solicita la cotización
  fileId: ObjectId,           // Archivo 3D
  materialId: ObjectId,       // Material seleccionado
  finishId: ObjectId,         // Acabado seleccionado
  quantity: Number,           // Cantidad de piezas
  totalPrice: Number,         // Precio total calculado
  status: String,             // Estado de la cotización
  expiresAt: Date,           // Fecha de expiración
  calculationDetails: {
    volume: Number,           // Volumen del modelo
    weight: Number,           // Peso calculado
    materialCost: Number,     // Costo del material
    finishCost: Number,       // Costo del acabado
    shippingCost: Number,     // Costo de envío
    tax: Number              // Impuestos
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `Role` (`src/models/Role.js`)

```javascript
{
  name: String,              // Nombre del rol (customer, moderator, admin)
  description: String,       // Descripción del rol
  permissions: [String],     // Lista de permisos
  isActive: Boolean,         // Estado del rol
  createdAt: Date,
  updatedAt: Date
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

// Obtener desglose de precios de un pedido
GET /api/v1/quote/breakdown/:orderId
Headers: Authorization: Bearer <token>

// Guardar cotización
POST /api/v1/quote/save
Headers: Authorization: Bearer <token>
Body: { fileId, materialId, finishId, quantity, totalPrice }
```

#### Gestión de Cotizaciones (`/api/v1/quotes`)

```javascript
// Guardar cotización
POST /api/v1/quotes/save
Headers: Authorization: Bearer <token>
Body: { fileId, materialId, finishId, quantity, totalPrice }

// Obtener cotizaciones del usuario
GET /api/v1/quotes/user
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20

// Obtener cotización específica
GET /api/v1/quotes/:quoteId
Headers: Authorization: Bearer <token>

// Eliminar cotización
DELETE /api/v1/quotes/:quoteId
Headers: Authorization: Bearer <token>

// [ADMIN] Obtener todas las cotizaciones con filtros
GET /api/v1/quotes/admin/all
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&status=&email=&dateFrom=&dateTo=

// [ADMIN] Obtener estadísticas de cotizaciones
GET /api/v1/quotes/admin/stats
Headers: Authorization: Bearer <token>

// [ADMIN] Limpiar cotizaciones expiradas
POST /api/v1/quotes/admin/cleanup
Headers: Authorization: Bearer <token>
```

#### Pedidos (`/api/v1/orders`)

```javascript
// Obtener pedidos del usuario
GET /api/v1/orders
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20

// Obtener pedido específico
GET /api/v1/orders/:id
Headers: Authorization: Bearer <token>

// Obtener pedidos por usuario
GET /api/v1/orders/user/:id
Headers: Authorization: Bearer <token>

// Obtener estados válidos de pedidos
GET /api/v1/orders/statuses
Headers: Authorization: Bearer <token>

// Crear nuevo pedido
POST /api/v1/orders
Headers: Authorization: Bearer <token>
Body: { fileId, materialId, finishId, quantity, deliveryAddress }

// Actualizar pedido
PUT /api/v1/orders/:id
Headers: Authorization: Bearer <token>
Body: { quantity, deliveryAddress }

// [ADMIN] Actualizar estado del pedido
PATCH /api/v1/orders/:id/status
Headers: Authorization: Bearer <token>
Body: { status }

// Eliminar pedido
DELETE /api/v1/orders/:id
Headers: Authorization: Bearer <token>

// [ADMIN] Obtener todos los pedidos
GET /api/v1/orders/admin
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&status=&dateFrom=&dateTo=
```

#### Direcciones (`/api/v1/addresses`)

```javascript
// Obtener todas las direcciones del usuario
GET /api/v1/addresses
Headers: Authorization: Bearer <token>

// Obtener dirección predeterminada
GET /api/v1/addresses/default
Headers: Authorization: Bearer <token>

// Obtener dirección específica
GET /api/v1/addresses/:id
Headers: Authorization: Bearer <token>

// Crear nueva dirección
POST /api/v1/addresses
Headers: Authorization: Bearer <token>
Body: { name, phone, notes, coordinates: { lat, lng } }

// Actualizar dirección
PUT /api/v1/addresses/:id
Headers: Authorization: Bearer <token>
Body: { name, phone, notes, coordinates }

// Establecer dirección como predeterminada
PUT /api/v1/addresses/:id/default
Headers: Authorization: Bearer <token>

// Eliminar dirección
DELETE /api/v1/addresses/:id
Headers: Authorization: Bearer <token>
```

#### Pagos Stripe (`/api/v1/stripe`)

```javascript
// Crear sesión de checkout
POST /api/v1/stripe/checkout-session
Headers: Authorization: Bearer <token>
Body: { orderId, successUrl, cancelUrl }

// Obtener sesión de checkout
GET /api/v1/stripe/checkout-session/:sessionId
Headers: Authorization: Bearer <token>
```

#### Administración (`/api/v1/admin`)

```javascript
// Obtener estadísticas de archivos
GET /api/v1/admin/stats
Headers: Authorization: Bearer <token>

// Obtener datos para gráficos
GET /api/v1/admin/chart-data
Headers: Authorization: Bearer <token>

// Limpiar archivos temporales
POST /api/v1/admin/cleanup
Headers: Authorization: Bearer <token>

// Listar archivos temporales
GET /api/v1/admin/temp-files
Headers: Authorization: Bearer <token>

// Listar archivos por estado
GET /api/v1/admin/files/:status
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20

// Eliminar archivo específico
DELETE /api/v1/admin/files/:fileId
Headers: Authorization: Bearer <token>

// Eliminación masiva de archivos
DELETE /api/v1/admin/files/bulk-delete
Headers: Authorization: Bearer <token>
Body: { fileIds: [array] }

// Limpiar archivos de usuario
POST /api/v1/admin/users/:userId/cleanup
Headers: Authorization: Bearer <token>

// Gestión de usuarios
GET /api/v1/admin/users
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&search=&role=&status=

// Obtener usuario específico
GET /api/v1/admin/users/:userId
Headers: Authorization: Bearer <token>

// Cambiar estado de usuario (activar/desactivar)
PATCH /api/v1/admin/users/:userId/toggle-active
Headers: Authorization: Bearer <token>
```

### Middleware

#### `authenticateToken` (`src/middleware/auth.js`)

Verifica JWT token y agrega `request.user` con información del usuario autenticado.

**Funcionalidad:**

- Extrae token del header Authorization
- Verifica validez del token JWT
- Agrega datos del usuario al request
- Maneja errores de token expirado/inválido

#### `requireRole` (`src/middleware/auth.js`)

Verifica que el usuario tenga el rol requerido para acceder a rutas específicas.

**Roles disponibles:**

- `customer` - Usuario normal
- `moderator` - Moderador del sistema
- `admin` - Administrador completo

#### `requireAdmin` (`src/middleware/auth.js`)

Middleware específico que requiere rol de administrador.

#### `validationErrorHandler` (`src/middleware/validationErrorHandler.js`)

Maneja errores de validación de forma consistente en toda la aplicación.

**Características:**

- Formatea errores de validación de Fastify
- Retorna respuestas consistentes
- Registra errores para debugging

### Middleware Frontend

#### `GuardMiddleware` (`public/middlewares/guardMiddleware.js`)

Protege rutas que requieren autenticación.

**Funcionalidades:**

- Verifica estado de autenticación
- Redirige a login si no está autenticado
- Permite acceso a rutas públicas

#### `RoleMiddleware` (`public/middlewares/roleMiddelware.js`)

Controla acceso basado en roles de usuario.

**Rutas protegidas:**

- **Customer:** `/dashboard`, `/profile`, `/calculator`, `/quotes`, `/checkout`, `/orders`
- **Admin:** `/panel`

**Características:**

- Verificación de roles en tiempo real
- Redirección automática a páginas autorizadas
- Manejo de cambios de estado de autenticación

## 🎨 Frontend

### Componentes

#### `HomeComponent` (`public/components/HomeComponent.js`)

**Responsabilidad:** Página de inicio adaptativa

**Funcionalidades:**

- Vista diferenciada para usuarios autenticados/no autenticados
- Enlaces rápidos a funcionalidades principales
- Estadísticas del servicio
- Call-to-actions para registro/login

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

#### `AuthComponent` (`public/components/LoginComponent.js` & `RegisterComponent.js`)

**Responsabilidad:** Autenticación de usuarios

**LoginComponent:**

- Formulario de inicio de sesión
- Validación en tiempo real
- Integración con Google OAuth
- Manejo de errores

**RegisterComponent:**

- Formulario de registro
- Validación de contraseñas
- Verificación de fortaleza de contraseña
- Validación de campos en tiempo real

#### `ProfileComponent` (`public/components/ProfileComponent.js`)

**Responsabilidad:** Gestión del perfil de usuario

**Funcionalidades:**

- Visualización de información del usuario
- Edición de datos personales
- Subida y gestión de avatar
- Cambio de contraseña
- Enlaces a órdenes y direcciones

#### `OrdersComponent` (`public/components/OrdersComponent.js`)

**Responsabilidad:** Gestión de pedidos

**Funcionalidades:**

- Lista de pedidos del usuario
- Filtrado por estado
- Visualización de detalles básicos
- Navegación a detalles completos
- Funciones de administrador (cambio de estado)

#### `OrderDetailComponent` (`public/components/OrderDetailComponent.js`)

**Responsabilidad:** Vista detallada de pedidos

**Funcionalidades:**

- Información completa del pedido
- Visualizador 3D interactivo con Three.js
- Timeline de estado del pedido
- Controles de modelo 3D (wireframe, pantalla completa, reset)
- Desglose de precios
- Información de entrega

#### `QuotesComponent` (`public/components/QuotesComponent.js`)

**Responsabilidad:** Gestión de cotizaciones guardadas

**Funcionalidades:**

- Lista de cotizaciones del usuario
- Conversión a pedidos
- Eliminación de cotizaciones
- Reutilización de configuraciones

#### `AddressesComponent` (`public/components/AddressesComponent.js`)

**Responsabilidad:** Gestión de direcciones

**Funcionalidades:**

- Lista de direcciones del usuario
- Crear nueva dirección con mapa interactivo (Leaflet)
- Editar direcciones existentes
- Establecer dirección predeterminada
- Validación de campos en tiempo real
- Integración con mapas para selección de ubicación

#### `CheckoutComponent` (`public/components/CheckoutComponent.js`)

**Responsabilidad:** Proceso de checkout

**Funcionalidades:**

- Resumen del pedido
- Selección de dirección de entrega
- Integración con Stripe para pagos
- Confirmación de compra

#### `PanelComponent` (`public/components/PanelComponent.js`)

**Responsabilidad:** Panel de administración

**Funcionalidades:**

- Navegación por pestañas
- Estadísticas del sistema
- Gestión de pedidos
- Gestión de cotizaciones
- Administración de archivos
- Gestión de usuarios

**Tabs Disponibles:**

- **StatsTab:** Estadísticas y métricas del sistema
- **OrdersTab:** Gestión completa de pedidos
- **QuotesTab:** Administración de cotizaciones
- **StorageTab:** Gestión de archivos y almacenamiento
- **UsersTab:** Administración de usuarios

#### `NavbarComponent` (`public/components/NavbarComponent.js`)

**Responsabilidad:** Navegación principal

#### `Toast` (`public/components/Toast.js`)

**Responsabilidad:** Sistema de notificaciones elegantes

```javascript
Toast.success("Operación exitosa");
Toast.error("Error en la operación");
Toast.warning("Advertencia");
Toast.info("Información");
```

**Características:**

- Posicionamiento automático
- Auto-dismissal configurable
- Animaciones suaves
- Colores por tipo de mensaje
- Stack de notificaciones

#### `DialogComponent` (`public/components/DialogComponent.js`)

**Responsabilidad:** Diálogos modales reutilizables

**Funcionalidades:**

- Confirmaciones de acciones
- Formularios modales
- Overlay con backdrop
- Manejo de eventos ESC y click fuera
- Animaciones de entrada/salida

## 📊 Características Técnicas Avanzadas

### Autenticación y Seguridad

#### Sistema JWT

- Tokens seguros con expiración configurable
- Refresh tokens para sesiones extendidas
- Invalidación de tokens en logout

#### Integración OAuth

- **Google OAuth 2.0** para login social
- Creación automática de cuentas
- Sincronización de datos de perfil

#### Roles y Permisos

- Sistema de roles jerárquico
- Middleware de autorización granular
- Protección de rutas por rol

### Gestión de Archivos

#### Análisis 3D Avanzado

```javascript
// Tecnologías utilizadas
- Three.js: Renderizado y manipulación 3D
- STL Loader: Carga de archivos STL
- OBJ Loader: Soporte para archivos OBJ
- Monte Carlo: Cálculo preciso de volumen
```

#### Almacenamiento Distribuido

- **MinIO** S3-compatible para archivos
- URLs firmadas para acceso seguro
- Optimización de almacenamiento
- Limpieza automática de archivos temporales

### Sistema de Cotizaciones

#### Algoritmo de Cálculo

```javascript
// Fórmulas principales
Peso = Volumen(cm³) × Densidad(g/cm³)
Costo_Material = Peso(g) × Precio_Por_Gramo($)
Costo_Acabado = Costo_Material × Multiplicador_Acabado
Costo_Envío = Costo_Base + (Peso × Factor_Envío)
Total_Sin_IVA = Costo_Material + Costo_Acabado + Costo_Envío
Total_Final = Total_Sin_IVA × (1 + IVA)
```

#### Gestión de Materiales

- Base de datos de materiales con propiedades físicas
- Precios dinámicos por material
- Soporte para nuevos materiales
- Cálculo automático de densidades

### Procesamiento de Pagos

#### Integración Stripe

- Checkout sessions seguras
- Webhooks para confirmación
- Manejo de reembolsos
- Soporte para múltiples monedas

#### Estados de Pedido

```javascript
Estados = [
	"pending", // Pendiente de pago
	"processing", // En producción
	"shipped", // Enviado
	"delivered", // Entregado
	"cancelled", // Cancelado
];
```

### Optimización y Performance

#### Sistema de Caché

- Cache de usuarios en memoria
- Cache de consultas frecuentes
- Invalidación inteligente
- Reducción de consultas a DB

#### Lazy Loading

- Carga diferida de componentes
- Optimización de bundle size
- Code splitting automático

### Monitoreo y Analytics

#### Métricas del Sistema

- Estadísticas de uso en tiempo real
- Métricas de performance
- Análisis de errores
- Dashboard administrativo

#### Logs Estructurados

- Logging centralizado
- Trazabilidad de requests
- Monitoreo de errores
- Alertas automáticas

### Servicios Frontend

#### `API` (`public/lib/api.js`)

Cliente HTTP centralizado para comunicación con el backend

**Métodos:**

```javascript
async get(endpoint, options = {})
async post(endpoint, data, options = {})
async put(endpoint, data, options = {})
async patch(endpoint, data, options = {})
async delete(endpoint, options = {})
```

**Características:**

- Manejo automático de tokens JWT
- Interceptores de error
- Base URL configurable (`/api/v1`)
- Manejo de respuestas JSON

#### `AuthService` (`public/services/authService.js`)

Gestión de autenticación

**Métodos:**

```javascript
async login(email, password)
async register(userData)
async logout()
async getCurrentUser()
async updateProfile(userData)
async changePassword(passwordData)
async uploadAvatar(file)
async deleteAvatar()
```

#### `QuotesService` (`public/services/quotesService.js`)

Gestión de cotizaciones

**Métodos:**

```javascript
async saveQuote(quoteData)
async getUserQuotes(page, limit)
async getQuoteById(quoteId)
async deleteQuote(quoteId)
async calculateQuote(data)
```

#### `OrderService` (`public/services/orderServices.js`)

Gestión de pedidos

**Métodos:**

```javascript
async createOrder(orderData)
async getOrdersByUserId()
async getOrderById(orderId)
async updateOrder(orderId, updateData)
async updateOrderStatus(orderId, status)
async removeOrder(orderId)
```

#### `AddressesService` (`public/services/addressesService.js`)

Gestión de direcciones

**Métodos:**

```javascript
async getAllAddresses()
async getDefaultAddress()
async getAddressById(addressId)
async createAddress(addressData)
async updateAddress(addressId, addressData)
async setDefaultAddress(addressId)
async deleteAddress(addressId)
```

#### `FileService` (`public/services/fileService.js`)

Gestión de archivos

**Métodos:**

```javascript
async uploadFile(file)
async uploadImage(file)
async getUserFiles()
async getFileById(fileId)
async deleteFile(fileId)
async getSignedUrl(fileKey)
```

#### `StripeService` (`public/services/stripeService.js`)

Integración con Stripe para pagos

**Métodos:**

```javascript
async createCheckoutSession(orderData)
async getCheckoutSession(sessionId)
async redirectToCheckout(sessionId)
```

#### `Router` (`public/services/router.js`)

Sistema de rutas del lado del cliente

**Funcionalidades:**

- Navegación SPA (Single Page Application)
- Rutas dinámicas con parámetros
- Middleware de autenticación y roles
- Manejo de historial del navegador
- Página 404 personalizada

**Rutas Disponibles:**

```javascript
"/": "home-component"                    // Página de inicio
"/login": "login-component"              // Inicio de sesión
"/register": "register-component"        // Registro
"/profile": "profile-component"          // Perfil del usuario
"/profile/addresses": "addresses-component" // Direcciones
"/panel": "panel-component"              // Panel de administración
"/calculator": "calculator-component"    // Calculadora de precios
"/quotes": "quotes-component"            // Cotizaciones guardadas
"/checkout": "checkout-component"        // Proceso de compra
"/orders": "orders-component"            // Lista de pedidos
"/orders/:id": "order-detail-component"  // Detalle de pedido
"/success": "success-purchase-component" // Compra exitosa
"/cancel": "cancel-purchase-component"   // Compra cancelada
```

#### `AuthStore` (`public/stores/authStore.js`)

Gestión de estado de autenticación

### Estado

#### `AuthStore` (`public/stores/authStore.js`)

Gestión del estado de autenticación global

```javascript
{
  isAuthenticated: Boolean,
  user: {
    userId: String,
    email: String,
    firstName: String,
    lastName: String,
    role: String,        // 'customer', 'moderator', 'admin'
    avatar: String,      // URL del avatar
    avatarKey: String,   // Clave en MinIO
    isActive: Boolean
  },
  token: String,
  isLoading: Boolean,
  error: String
}
```

**Métodos:**

```javascript
// Inicialización
async init()

// Gestión de estado
login(userData, token)
logout()
updateUser(userData)
setLoading(loading)
setError(error)

// Verificadores
isAuthenticated()
getUser()
getToken()

// Suscripción a cambios
subscribe(callback)
unsubscribe(callback)
```

#### `CheckoutStore` (`public/stores/checkoutStore.js`)

Gestión del estado del proceso de checkout

```javascript
{
  currentQuote: Object,    // Cotización actual
  selectedAddress: Object, // Dirección seleccionada
  orderData: Object,       // Datos del pedido
  paymentStatus: String,   // Estado del pago
  isProcessing: Boolean
}
```

#### `RouteStore` (`public/stores/routeStore.js`)

Gestión del estado de navegación

```javascript
{
  currentRoute: String,    // Ruta actual
  params: Object,          // Parámetros de la ruta
  query: Object           // Query parameters
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
├── src/                          # Backend (Node.js + Fastify)
│   ├── config/                   # Configuraciones
│   │   ├── database.js          # Configuración MongoDB
│   │   └── stripe.js            # Configuración Stripe
│   ├── controllers/              # Controladores API
│   │   ├── addressController.js  # Gestión de direcciones
│   │   ├── adminController.js    # Panel administrativo
│   │   ├── authController.js     # Autenticación y usuarios
│   │   ├── fileController.js     # Gestión de archivos
│   │   ├── orderController.js    # Gestión de pedidos
│   │   ├── quoteController.js    # Cotizaciones básicas
│   │   ├── quoteManagementController.js # Gestión avanzada de cotizaciones
│   │   └── stripeController.js   # Procesamiento de pagos
│   ├── middleware/               # Middleware de servidor
│   │   ├── auth.js              # Autenticación JWT
│   │   └── validationErrorHandler.js # Manejo de errores
│   ├── models/                   # Modelos de MongoDB
│   │   ├── Address.js           # Direcciones de usuarios
│   │   ├── File.js              # Archivos 3D subidos
│   │   ├── Finish.js            # Acabados disponibles
│   │   ├── Material.js          # Materiales de impresión
│   │   ├── Order.js             # Pedidos de usuarios
│   │   ├── PriceBreakdown.js    # Desglose de precios
│   │   ├── Quote.js             # Cotizaciones guardadas
│   │   ├── Role.js              # Roles del sistema
│   │   └── User.js              # Usuarios registrados
│   ├── routes/                   # Definición de rutas API
│   │   ├── addresses.js         # Rutas de direcciones
│   │   ├── admin.js             # Rutas administrativas
│   │   ├── auth.js              # Rutas de autenticación
│   │   ├── file.js              # Rutas de archivos
│   │   ├── orders.js            # Rutas de pedidos
│   │   ├── quote.js             # Rutas de cotización
│   │   ├── quotes.js            # Rutas de gestión de cotizaciones
│   │   └── stripe.js            # Rutas de pagos
│   ├── services/                 # Lógica de negocio
│   │   ├── addressService.js    # Servicio de direcciones
│   │   ├── authService.js       # Servicio de autenticación
│   │   ├── cacheService.js      # Sistema de caché
│   │   ├── cleanupService.js    # Limpieza de archivos
│   │   ├── fileAnalysisService.js # Análisis de archivos 3D
│   │   ├── orderService.js      # Servicio de pedidos
│   │   ├── quoteManagementService.js # Gestión de cotizaciones
│   │   ├── quoteService.js      # Cálculo de cotizaciones
│   │   ├── storageService.js    # Gestión de almacenamiento MinIO
│   │   ├── stripeService.js     # Integración con Stripe
│   │   └── userService.js       # Gestión de usuarios
│   ├── types/                    # Definiciones de tipos
│   ├── utils/                    # Utilidades
│   │   ├── errors.js            # Clases de error personalizadas
│   │   ├── initData.js          # Inicialización de datos
│   │   └── responseHelper.js    # Helpers para respuestas
│   ├── validations/              # Esquemas de validación
│   │   ├── addressValidations.js # Validaciones de direcciones
│   │   ├── authValidations.js   # Validaciones de autenticación
│   │   └── commonValidations.js # Validaciones comunes
│   └── index.js                 # Punto de entrada del servidor
├── public/                       # Frontend (Vanilla JS + Web Components)
│   ├── components/              # Web Components
│   │   ├── panel-tabs/          # Componentes del panel admin
│   │   │   ├── OrdersTab.js     # Tab de gestión de pedidos
│   │   │   ├── QuotesTab.js     # Tab de gestión de cotizaciones
│   │   │   ├── StatsTab.js      # Tab de estadísticas
│   │   │   ├── StorageTab.js    # Tab de gestión de archivos
│   │   │   └── UsersTab.js      # Tab de gestión de usuarios
│   │   ├── AddressesComponent.js # Gestión de direcciones
│   │   ├── CalculatorComponent.js # Calculadora de precios
│   │   ├── CancelPurchaseComponent.js # Compra cancelada
│   │   ├── CheckoutComponent.js  # Proceso de checkout
│   │   ├── DialogComponent.js    # Diálogos modales
│   │   ├── HomeComponent.js      # Página de inicio
│   │   ├── LoginComponent.js     # Formulario de login
│   │   ├── NavbarComponent.js    # Barra de navegación
│   │   ├── NotFoundComponent.js  # Página 404
│   │   ├── OrderDetailComponent.js # Detalles de pedido
│   │   ├── OrdersComponent.js    # Lista de pedidos
│   │   ├── PanelComponent.js     # Panel administrativo
│   │   ├── ProfileComponent.js   # Perfil de usuario
│   │   ├── QuotesComponent.js    # Lista de cotizaciones
│   │   ├── RegisterComponent.js  # Formulario de registro
│   │   ├── SuccessPurchaseComponent.js # Compra exitosa
│   │   ├── Toast.js             # Sistema de notificaciones
│   │   └── index.js             # Exportación de componentes
│   ├── lib/                     # Librerías base
│   │   └── api.js               # Cliente HTTP
│   ├── middlewares/             # Middleware del frontend
│   │   ├── guardMiddleware.js   # Protección de rutas
│   │   └── roleMiddelware.js    # Control de roles
│   ├── services/                # Servicios del frontend
│   │   ├── addressesService.js  # Servicio de direcciones
│   │   ├── authService.js       # Servicio de autenticación
│   │   ├── fileService.js       # Servicio de archivos
│   │   ├── index.js             # Exportación de servicios
│   │   ├── orderServices.js     # Servicio de pedidos
│   │   ├── quotesService.js     # Servicio de cotizaciones
│   │   ├── router.js            # Sistema de rutas SPA
│   │   └── stripeService.js     # Servicio de pagos
│   ├── stores/                  # Gestión de estado global
│   │   ├── authStore.js         # Estado de autenticación
│   │   ├── checkoutStore.js     # Estado del checkout
│   │   └── routeStore.js        # Estado de navegación
│   ├── styles/                  # Hojas de estilo CSS
│   │   ├── addresses.css        # Estilos de direcciones
│   │   ├── admin.css            # Estilos del panel admin
│   │   ├── auth.css             # Estilos de autenticación
│   │   ├── calculator.css       # Estilos de calculadora
│   │   ├── checkout.css         # Estilos de checkout
│   │   ├── dashboard.css        # Estilos del dashboard
│   │   ├── home.css             # Estilos de la página inicio
│   │   ├── order-detail.css     # Estilos de detalles de pedido
│   │   ├── orders.css           # Estilos de lista de pedidos
│   │   └── quotes.css           # Estilos de cotizaciones
│   ├── utils/                   # Utilidades del frontend
│   ├── app.js                   # Inicialización de la aplicación
│   ├── index.html               # Página principal
│   ├── style.css                # Estilos globales
│   └── test.html                # Página de pruebas
├── docker-compose.yml           # Configuración de servicios Docker
├── env.example                  # Plantilla de variables de entorno
├── historias-de-usuario.md      # Documentación de historias de usuario
├── mongo-init.js                # Script de inicialización de MongoDB
├── nodemon.json                 # Configuración de nodemon
├── package.json                 # Dependencias del proyecto
├── pnpm-lock.yaml              # Lock file de pnpm
├── README.md                    # Este archivo de documentación
├── test-cube-large.stl         # Archivo de prueba STL grande
├── test-cube-very-large.obj     # Archivo de prueba OBJ muy grande
└── test-cube.stl               # Archivo de prueba STL básico
```

## 🎯 Características Destacadas

### ✅ Implementado

- ✅ **Análisis real de archivos 3D** (Three.js + STL/OBJ Loaders)
- ✅ **Cálculo preciso de volumen** (Algoritmo Monte Carlo con 10,000 puntos)
- ✅ **Sistema de precios dinámico** con materiales y acabados
- ✅ **Autenticación JWT completa** con roles y permisos
- ✅ **Integración Google OAuth** para login social
- ✅ **Almacenamiento S3-compatible** (MinIO para archivos)
- ✅ **Panel de administración avanzado** con estadísticas
- ✅ **Gestión completa de usuarios** (CRUD + roles)
- ✅ **Sistema de pedidos completo** con estados y tracking
- ✅ **Gestión de direcciones** con mapas interactivos (Leaflet)
- ✅ **Cotizaciones guardadas** con historial y reutilización
- ✅ **Integración de pagos** (Stripe Checkout)
- ✅ **Visualizador 3D interactivo** con controles avanzados
- ✅ **Interfaz responsive** con Web Components
- ✅ **Sistema de notificaciones** elegante (Toast)
- ✅ **Validación en tiempo real** en formularios
- ✅ **Sistema de caché** para optimización
- ✅ **Limpieza automática** de archivos temporales
- ✅ **Middleware de seguridad** completo
- ✅ **API RESTful documentada** con validaciones

### 🚧 Próximamente

- � **Notificaciones por email** (confirmaciones, actualizaciones)
- � **Aplicación móvil** (React Native o PWA)
- 🔄 **Sincronización en tiempo real** (WebSockets)
- 📊 **Analytics avanzados** (métricas de usuario detalladas)
- 🌐 **Soporte multiidioma** (i18n)
- 🎨 **Editor 3D integrado** (edición básica de modelos)
- 🤖 **IA para optimización** de modelos para impresión
- � **Gestión de inventario** de materiales
- 💎 **Programa de fidelidad** y descuentos
- � **Autenticación de dos factores** (2FA)

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
