### **🧾AUTENTICACIÓN Y GESTIÓN DE CUENTAS**

### **USUARIO-001**

- **Título**: Como usuario, quiero registrarme para poder acceder a los servicios de impresión.
- **Criterios de aceptación**:
  - El formulario de registro incluye nombre, email y contraseña.
  - Validación de email único.
  - Redirección al dashboard tras registro exitoso.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h

### **USUARIO-002**

- **Título**: Como usuario, quiero iniciar sesión con mi correo y contraseña.
- **Criterios de aceptación**:
  - Login con email y contraseña.
  - Mostrar errores si los datos son incorrectos.
- **Prioridad**: Alta
- **Horas estimadas**: 3

### **USUARIO-003**

- **Título**: Como usuario, quiero recuperar mi contraseña si la olvidé.
- **Criterios de aceptación**:
  - Ingreso de correo para recibir enlace de recuperación.
  - Validación de token y creación de nueva contraseña.
- **Prioridad**: Media
- **Horas estimadas**: 5 h

### **USUARIO-004**

- **Título**: Como usuario, quiero iniciar sesión con mi cuenta de Google para mayor comodidad.
- **Criterios de aceptación**:
  - Botón de Google Login visible.
  - Al autenticarse con Google, se crea una cuenta si no existe.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

---

### **📤 CARGA Y CONFIGURACIÓN DEL MODELO**

### **IMPRESION-001**

- **Título**: Como usuario, quiero subir un archivo STL/OBJ para solicitar una impresión 3D.
- **Criterios de aceptación** ya definidos arriba.
- **Prioridad**: Alta
- **Horas estimadas**: 8 h

### **IMPRESION-002**

- **Título**: Como usuario, quiero elegir entre distintos materiales para mi modelo.
- **Criterios de aceptación**:
  - Selector de materiales disponibles.
  - Se muestra impacto en el precio.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h

### **IMPRESION-003**

- **Título**: Como usuario, quiero seleccionar acabados visuales (pintura, lijado, etc).
- **Criterios de aceptación**:
  - Selector de acabados.
  - Afecta el precio final.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h

### **IMPRESION-004**

- **Título**: Como usuario, quiero ver una vista previa de mi modelo 3D cargado.
- **Criterios de aceptación**:
  - Se muestra un visor 3D.
  - Rotación, zoom y cambio de perspectiva.
- **Prioridad**: Media-Alta
- **Horas estimadas**: 8 h

---

### **💵 COTIZACIÓN Y PAGO**

### **COTIZACION-001**

- **Título**: Como usuario, quiero obtener una cotización automática según el modelo y material.
- **Prioridad**: Alta
- **Horas estimadas**: 16 h

### **COTIZACION-002**

- **Título**: Como usuario, quiero ver un desglose de los costos.
- **Criterios de aceptación**:
  - Volumen, complejidad, material, acabado.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **PAGO-001**

- **Título**: Como usuario, quiero confirmar mi pedido y proceder al pago.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **PAGO-002**

- **Título**: Como usuario, quiero pagar con Páguelo Fácil de forma segura.
- **Criterios de aceptación**:
  - Integración con gateway de pago.
  - Confirmación visual de transacción.
- **Prioridad**: Alta
- **Horas estimadas**: 10 h

### **PAGO-003**

- **Título**: Como usuario, quiero recibir un comprobante por email.
- **Criterios de aceptación**:
  - Email automático tras el pago exitoso.
- **Prioridad**: Media
- **Horas estimadas**: 3 h

### **PAGO-004**

- **Título**: Como usuario, quiero elegir entre varios métodos de pago (tarjeta, Stripe o PayPal).
- **Criterios de aceptación**:
  - Módulo de selección de método.
  - Integración con Stripe y PayPal.
- **Prioridad**: Alta
- **Horas estimadas**: 8 h

### **PAGO-005**

- **Título**: Como usuario, quiero guardar mis métodos de pago preferidos para facilitar compras futuras.
- **Criterios de aceptación**:
  - Permitir guardar tarjeta o cuenta PayPal con tokenización segura.
- **Prioridad**: Media
- **Horas estimadas**: 5 h

---

### **🧪 REVISIÓN TÉCNICA Y PRODUCCIÓN**

### **ADMIN-001**

- **Título**: Como administrador, quiero ver los modelos cargados y listos para revisión.
- **Criterios de aceptación**:
  - Panel con lista de modelos pendientes.
- **Prioridad**: Alta
- **Horas estimadas**: 5 h

### **ADMIN-002**

- **Título**: Como administrador, quiero visualizar el modelo 3D y comprobar su viabilidad.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **ADMIN-003**

- **Título**: Como administrador, quiero aprobar o rechazar un modelo con comentarios.
- **Criterios de aceptación**:
  - Formulario de decisión con notas.
- **Prioridad**: Alta
- **Horas estimadas**: 5 h

### **PRODUCCION-001**

- **Título**: Como administrador, quiero mover un modelo aprobado a producción.
- **Criterios de aceptación**:
  - Cambio de estado automático.
- **Prioridad**: Alta
- **Horas estimadas**: 3 h

---

### **📦 SEGUIMIENTO Y ENVÍO**

### **ENVIO-001**

- **Título**: Como usuario, quiero ver el estado actual de mi pedido.
- **Criterios de aceptación**:
  - Página de pedidos con estados: Revisión, Producción, Enviado, Entregado.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **ENVIO-002**

- **Título**: Como usuario, quiero recibir notificaciones sobre el avance de mi pedido.
- **Criterios de aceptación**:
  - Email o notificación web por cada cambio de estado.
- **Prioridad**: Media-Alta
- **Horas estimadas**: 5 h

### **ENVIO-003**

- **Título**: Como usuario, quiero obtener un número de tracking si mi pedido fue enviado.
- **Criterios de aceptación**:
  - Integración con empresa de envíos.
- **Prioridad**: Media
- **Horas estimadas**: 6 h

### **ENVIO-004**

- **Título**: Como usuario, quiero seleccionar la fecha deseada para la entrega de mi pedido.
- **Criterios de aceptación**:
  - Calendario para elegir fecha futura disponible.
  - Se calcula costo adicional si aplica.
- **Prioridad**: Alta
- **Horas estimadas**: 5 h

### **ENVIO-005**

- **Título**: Como usuario, quiero ingresar y guardar mi dirección de entrega.
- **Criterios de aceptación**:
  - Formulario con campos estándar (dirección, ciudad, código postal, etc.).
  - Opción de guardar dirección para futuros pedidos.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h

### **PAGO-004**

- **Título**: Como usuario, quiero elegir entre varios métodos de pago (tarjeta, Stripe o PayPal).
- **Criterios de aceptación**:
  - Módulo de selección de método.
  - Integración con Stripe y PayPal.
- **Prioridad**: Alta
- **Horas estimadas**: 8 h

---

### **📋 GESTIÓN DE PEDIDOS Y PERFIL**

### **CUENTA-001**

- **Título**: Como usuario, quiero ver un historial de mis pedidos.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h

### **CUENTA-002**

- **Título**: Como usuario, quiero poder ver el detalle de un pedido anterior.
- **Prioridad**: Alta
- **Horas estimadas**: 3 h

### **CUENTA-003**

- **Título**: Como usuario, quiero actualizar mi información personal.
- **Prioridad**: Media
- **Horas estimadas**: 4 h

### **CUENTA-004**

- **Título**: Como usuario, quiero cambiar mi contraseña desde mi perfil.
- **Prioridad**: Media
- **Horas estimadas**: 3 h

---

### **🔒 SEGURIDAD Y ROLES**

### **SEGURIDAD-001**

- **Título**: Como administrador, quiero tener un panel de control exclusivo para gestionar pedidos.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **SEGURIDAD-002**

- **Título**: Como sistema, quiero restringir funciones de administración solo a usuarios autorizados.
- **Prioridad**: Alta
- **Horas estimadas**: 5 h

---

### **📊 MEJORAS Y EXTRAS**

### **UX-001**

- **Título**: Como usuario, quiero que el sistema me indique si el archivo STL tiene errores antes de enviarlo.
- **Prioridad**: Media
- **Horas estimadas**: 6 h

### **UX-002**

- **Título**: Como usuario, quiero poder duplicar un pedido anterior para facilitar nuevas solicitudes.
- **Prioridad**: Media
- **Horas estimadas**: 4 h

### **UX-003**

- **Título**: Como usuario, quiero dejar una reseña o calificación del servicio.
- **Prioridad**: Baja
- **Horas estimadas**: 4 h

### **UX-004**

- **Título**: Como administrador, quiero filtrar pedidos por estado, usuario y fecha.
- **Prioridad**: Media
- **Horas estimadas**: 4 h

### **UX-005**

- **Título**: Como sistema, quiero almacenar los archivos en la nube (S3 u otro) para facilitar la gestión.
- **Prioridad**: Alta
- **Horas estimadas**: 6 h

### **UX-007**

- **Título**: Como sistema, quiero validar automáticamente si una fecha de entrega está disponible según la capacidad diaria.
- **Criterios de aceptación**:
  - Mostrar fechas no disponibles como deshabilitadas en el calendario.
- **Prioridad**: Media
- **Horas estimadas**: 6 h

### **UX-008**

- **Título**: Como administrador, quiero ver la lista de pedidos con sus fechas estimadas de entrega para planificar la producción.
- **Criterios de aceptación**:
  - Vista de calendario o lista ordenada.
- **Prioridad**: Media-Alta
- **Horas estimadas**: 5 h

### **UX-009**

- **Título**: Como usuario, quiero modificar mi dirección de entrega si aún no ha sido enviado el pedido.
- **Criterios de aceptación**:
  - Edición disponible hasta cierto estado del pedido.
- **Prioridad**: Media
- **Horas estimadas**: 4 h

## Tiempo

### **TIEMPO-001**

- **Título**: Como usuario, quiero ver el tiempo estimado de producción y entrega antes de confirmar.
- **Criterios de aceptación**:
  - Mostrar un rango estimado (ej: 3-5 días hábiles).
  - Cambia si se elige fecha específica.
- **Prioridad**: Alta
- **Horas estimadas**: 4 h
