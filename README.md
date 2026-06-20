# Panificadora Industrial "La Espiga de Oro S.R.L." - Backend API

Este proyecto es el backend para el sistema de gestión de la panificadora "La Espiga de Oro S.R.L.". Permite la administración del catálogo de productos y la gestión integral de pedidos para las diferentes sucursales y franquicias.

## Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias:
```bash
   npm install
```
3. Crear el archivo `.env` en la raíz del proyecto configurando las variables de entorno necesarias. El proyecto se conecta a una base de datos remota en **MongoDB Atlas** y utiliza sesiones:
```dotenv
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/la-espiga-de-oro?retryWrites=true&w=majority
```
*Nota: Asegúrate de reemplazar `<usuario>`, `<password>` y `<cluster>` con tus credenciales de MongoDB Atlas correspondientes.*

4. Iniciar el servidor:
```bash
   npm run dev
```
   *El servidor se iniciará en el puerto especificado en el archivo `.env` o en el 3000 por defecto.*

## Base de Datos y Persistencia

Anteriormente, el sistema persistía la información de forma local mediante archivos JSON y requería la ejecución de semillas (`seeds`). En la versión actual:
* **Persistencia Centralizada**: Se utiliza **MongoDB Atlas** en la nube como base de datos y **Mongoose** como ODM para la modelación de esquemas y validaciones de negocio en el backend.
* **Sin Semillas Locales**: Ya no aplica la ejecución de scripts de semillas locales (`seedProductos.js`, etc.) para levantar la base de datos de cero, puesto que las colecciones se consumen y actualizan directamente en la base de datos de Atlas.
* **Integridad de Datos**: Los modelos se administran como esquemas estructurados bajo el directorio `models/`.


## Documentación de Controladores

La API está dividida en tres módulos principales controlados por sus respectivos archivos:

### `productoController.js` (Gestión del Catálogo)
Este controlador gestiona todo el catálogo de productos de "La Espiga de Oro", asegurando que los datos se persistan correctamente en MongoDB y controlando las dependencias con los pedidos.

* **`crearProducto(req, res)`:**
  * **Lógica:** Valida que el `body` incluya todos los campos necesarios (nombre, precio, descripción, stock) y que los tipos de datos sean correctos. Verifica que no exista un producto con el mismo nombre (búsqueda insensible a mayúsculas mediante regex). Si todo es correcto, crea y guarda el documento en MongoDB, que genera el `_id` automáticamente.
* **`obtenerProductos(req, res)`:**
  * **Lógica:** Consulta la colección de productos en MongoDB y devuelve el array completo como respuesta.
* **`obtenerProductoPorId(req, res)`:**
  * **Lógica:** Recibe un `id` por parámetro. Busca el documento por su `_id` en MongoDB. Si no existe, devuelve un error `404`. Si existe, devuelve su información.
* **`actualizarProducto(req, res)`:**
  * **Lógica:** Busca el producto por `_id`. Solo actualiza los campos recibidos en el body, sin pisar los campos no enviados. Utiliza `findByIdAndUpdate` con `runValidators: true` para asegurar la integridad de los datos.
* **`eliminarProducto(req, res)`:**
  * **Lógica:** Aplica **validación cruzada entre módulos**. Antes de eliminar, consulta la colección de pedidos. Verifica que el producto **no esté incluido en ningún pedido con estado "pendiente"**. Si hay conflicto, bloquea la eliminación. Si no, elimina el documento con `findByIdAndDelete`.

### `clienteController.js` (Gestión de Sucursales y Franquicias)
Este controlador administra los clientes del sistema, tanto sucursales propias como franquicias.

* **`crearCliente(req, res)`:**
  * **Lógica:** Valida los campos obligatorios (nombre, tipo, dirección de entrega). Crea y guarda el documento en MongoDB.
* **`obtenerClientes(req, res)`:**
  * **Lógica:** Devuelve todos los clientes activos por defecto. Si se pasa el query param `incluirInactivos=true`, devuelve todos.
* **`obtenerClientePorId(req, res)`:**
  * **Lógica:** Busca el cliente por `_id`. Si no existe, devuelve `404`.
* **`actualizarCliente(req, res)`:**
  * **Lógica:** Actualiza los campos recibidos usando `findByIdAndUpdate` con `runValidators: true`.
* **`eliminarCliente(req, res)`:**
  * **Lógica:** Realiza una **baja lógica**: no elimina el documento sino que setea `activo: false`, preservando el historial de pedidos asociados.

### `pedidoController.js` (Gestión de Pedidos)
Este controlador administra el flujo de pedidos de las franquicias y sucursales.

* **`crearPedido(req, res)`:**
  * **Lógica:** Verifica que el `clienteId` exista en la base de datos y que esté activo. Por cada ítem en `detalles`, busca el producto por `_id`, valida que tenga stock suficiente, y calcula el subtotal tomando el precio directamente desde la base de datos. Guarda el pedido y descuenta el stock de cada producto involucrado.
* **`obtenerPedidos(req, res)`:**
  * **Lógica:** Consulta todos los pedidos usando `populate` para incluir los datos completos del cliente y los productos. Devuelve ordenados por fecha descendente.
* **`obtenerPedidoPorId(req, res)`:**
  * **Lógica:** Recibe el `id` por parámetro y retorna la estructura completa del pedido con datos poblados de cliente y productos.
* **`actualizarEstadoPedido(req, res)`:**
  * **Lógica:** Gestiona el **flujo de estados** de un pedido aplicando una regla de negocio estricta:
    * De *pendiente* **sólo** puede pasar a *en producción*.
    * De *en producción* **sólo** puede pasar a *despachado*.
    * De *despachado* **sólo** puede pasar a *entregado*.
  * Si el estado solicitado rompe esta secuencia, lanza un error `400`.

## Guía de Pruebas

A continuación, se detallan las estructuras JSON, las rutas y los flujos recomendados para probar de manera integral las funcionalidades y reglas de negocio del sistema.

### 1. Estructuras de Datos (JSON Payloads)

#### Módulo de Productos

* **Alta de Producto (`POST /productos`)**
  * **Endpoint:** `http://localhost:3000/productos`
  * **Body (JSON):**
    ```json
    {
      "nombre": "Medialunas de manteca",
      "precio": 800,
      "descripcion": "Docena de medialunas de manteca dulces.",
      "stock": 150
    }
    ```

* **Actualizar Producto (`PATCH /productos/:id`)**
  * **Endpoint:** `http://localhost:3000/productos/<id_producto>`
  * **Body (JSON):**
    ```json
    {
      "precio": 950,
      "stock": 120
    }
    ```
  * *Nota: Solo se actualizan los campos enviados en el body, conservando el valor de los demás.*

* **Eliminación de Producto (`DELETE /productos/:id`)**
  * **Endpoint:** `http://localhost:3000/productos/<id_producto>`
  * *Nota: No se requiere cuerpo. Ver restricción de eliminación en los flujos de negocio.*

---

#### Módulo de Clientes

* **Alta de Cliente (`POST /clientes` o `POST /admin/clientes/nuevo`)**
  * **Endpoint:** `http://localhost:3000/clientes`
  * **Body (JSON):**
    ```json
    {
      "nombre": "Franquicia Tigre Centro",
      "tipo": "FRANQUICIA",
      "configuracion_logistica": {
        "direccion_entrega": "Av. Cazón 1000, Tigre, GBA",
        "zona_reparto": "Zona Norte",
        "dias_entrega": ["Lunes", "Jueves"],
        "horario_limite_pedido": "16:00"
      },
      "finanzas": {
        "porcentaje_royalty": 8,
        "cuit_facturacion": "20-11111111-1"
      }
    }
    ```

* **Actualizar Cliente (`PUT /clientes/:id`)**
  * **Endpoint:** `http://localhost:3000/clientes/<id_cliente>`
  * **Body (JSON):**
    ```json
    {
      "nombre": "Franquicia Tigre Norte",
      "tipo": "FRANQUICIA",
      "configuracion_logistica": {
        "direccion_entrega": "Av. del Libertador 4500, Tigre, GBA",
        "zona_reparto": "Zona Norte",
        "dias_entrega": ["Lunes", "Miércoles", "Viernes"],
        "horario_limite_pedido": "18:00"
      }
    }
    ```

* **Baja de Cliente (`DELETE /clientes/:id`)**
  * **Endpoint:** `http://localhost:3000/clientes/<id_cliente>`
  * *Nota: Realiza una baja lógica desactivando la propiedad `activo` del cliente.*

---

#### Módulo de Pedidos

* **Alta de Pedido (`POST /pedidos`)**
  * **Endpoint:** `http://localhost:3000/pedidos`
  * **Body (JSON):**
    ```json
    {
      "clienteId": "64b0f745c1a4e58b12345678", 
      "detalles": [
        {
          "productoId": "64b0f793c1a4e58b87654321",
          "cantidad": 12
        }
      ]
    }
    ```
  * *Nota: Los IDs de cliente y producto deben ser existentes y válidos de MongoDB Atlas. El precio unitario de cada producto y los totales/subtotales se resuelven de forma automática en el servidor.*

* **Actualizar Estado de Pedido (`PATCH /pedidos/:id/estado`)**
  * **Endpoint:** `http://localhost:3000/pedidos/<id_pedido>/estado`
  * **Body (JSON):**
    ```json
    {
      "estado": "en producción"
    }
    ```
  * *Nota: Los valores permitidos son: `pendiente`, `en producción`, `despachado`, `entregado`.*

---

#### Módulo de Usuarios y Autenticación

* **Alta de Usuario (`POST /usuarios`)**
  * **Endpoint:** `http://localhost:3000/usuarios`
  * **Body (JSON):**
    ```json
    {
      "usuario": "tigre_admin",
      "password": "Password123",
      "rol": "CLIENTE",
      "clienteId": "64b0f745c1a4e58b12345678"
    }
    ```
  * *Nota: El nombre del usuario se guarda en minúsculas y sin espacios. Si no se envía el campo `rol`, toma por defecto `'CLIENTE'`.*

* **Inicio de Sesión (`POST /portal/login`)**
  * **Endpoint:** `http://localhost:3000/portal/login`
  * **Body (URL-Encoded o JSON):**
    ```json
    {
      "usuario": "tigre_admin",
      "password": "Password123"
    }
    ```

* **Cambio Obligatorio de Contraseña (`POST /portal/cambiar-password`)**
  * **Endpoint:** `http://localhost:3000/portal/cambiar-password`
  * **Body (URL-Encoded o JSON):**
    ```json
    {
      "password": "NuevaPassword456",
      "confirmarPassword": "NuevaPassword456"
    }
    ```

---

### 2. Guía de Flujos Críticos de Negocio (Paso a Paso)

Para verificar el cumplimiento de las reglas de negocio más complejas del backend, se recomienda seguir estos escenarios estructurados:

#### Escenario A: Control de Flujo y Secuencia de Estados de Pedidos
* **Objetivo:** Verificar que el pedido solo transiciona en el orden estricto: `pendiente` -> `en producción` -> `despachado` -> `entregado`.
1. **Crear el Pedido:** Realiza un `POST /pedidos` para generar un nuevo pedido. El estado inicial será automáticamente `pendiente`.
2. **Transición Incorrecta (Fallo esperado):** Realiza un `PATCH /pedidos/<id>/estado` enviando `"estado": "despachado"` o `"estado": "entregado"`.
   * *Resultado esperado:* HTTP `400 Bad Request` indicando que no se puede saltar la secuencia.
3. **Transición Correcta (Éxito):** Realiza un `PATCH /pedidos/<id>/estado` enviando `"estado": "en producción"`.
   * *Resultado esperado:* HTTP `200 OK` con el estado actualizado correctamente.
4. **Validación del Siguiente Paso:** Intenta retroceder el estado enviando `"estado": "pendiente"`.
   * *Resultado esperado:* HTTP `400 Bad Request`.

#### Escenario B: Validación Cruzada e Integridad del Catálogo
* **Objetivo:** Verificar que no se eliminen productos que forman parte de pedidos pendientes (evitando la inconsistencia de datos).
1. **Crear Producto:** Crea un producto con `POST /productos` (por ejemplo, "Pan lactal"). Copia su `_id` generado.
2. **Crear Pedido Asociado:** Crea un pedido (`POST /pedidos`) agregando el producto anterior con estado inicial `pendiente`.
3. **Intento de Eliminación (Fallo esperado):** Realiza un `DELETE /productos/<id_producto>`.
   * *Resultado esperado:* HTTP `400 Bad Request` indicando que el producto no puede ser eliminado por estar asociado a un pedido activo (pendiente).
4. **Resolución del Conflicto:** Actualiza el estado de la orden a `"en producción"`, luego a `"despachado"` y finalmente a `"entregado"` mediante peticiones secuenciales.
5. **Intento de Eliminación Final (Éxito):** Intenta el `DELETE /productos/<id_producto>` nuevamente.
   * *Resultado esperado:* HTTP `200 OK` o `204 No Content`. El producto se elimina correctamente porque el pedido ya no está en estado "pendiente".

#### Escenario C: Baja Lógica de Clientes
* **Objetivo:** Verificar que eliminar un cliente no remueva su registro de la base de datos (preservando estadísticas e históricos), sino que lo inhabilite.
1. **Crear Cliente:** Crea un cliente con `POST /clientes` y toma nota de su `_id`.
2. **Eliminar Cliente:** Envía una solicitud `DELETE /clientes/<id_cliente>`.
   * *Resultado esperado:* HTTP `200 OK` con el cliente actualizado.
3. **Verificación de la Base de Datos:** Realiza un `GET /clientes/<id_cliente>`.
   * *Resultado esperado:* HTTP `200 OK` pero el cuerpo del objeto debe contener `"activo": false`.
4. **Verificación en el Listado General:** Realiza un `GET /clientes`.
   * *Resultado esperado:* El cliente inactivo no debe aparecer en la lista, a menos que se incluya explicitamente el parámetro query `?incluirInactivos=true`.

#### Escenario D: Control e Integridad del Stock
* **Objetivo:** Asegurar que no se vendan productos sin stock suficiente y que el stock disminuya tras crear un pedido válido.
1. **Consultar Stock Inicial:** Crea un producto con stock: 10 y precio: 100. Toma nota de su `_id`.
2. **Crear Pedido Excediendo Stock (Fallo esperado):** Crea un pedido (`POST /pedidos`) solicitando una cantidad de 15 del producto.
   * *Resultado esperado:* HTTP `400 Bad Request` con mensaje indicando stock insuficiente.
3. **Verificar Persistencia del Stock:** Consulta el producto con `GET /productos/<id>`. Verifica que el stock sigue siendo 10.
4. **Crear Pedido Válido (Éxito):** Crea un pedido solicitando una cantidad de 4 del producto.
   * *Resultado esperado:* HTTP `201 Created`.
5. **Verificar Descuento del Stock:** Consulta el producto con `GET /productos/<id>`. El stock debe haberse reducido a 6.

#### Escenario E: Autenticación y Autorización (Cookies y Sesiones)
* **Objetivo:** Asegurar que los paneles protegidos no sean accesibles sin la sesión y el rol correspondiente.
1. **Acceso sin Loguearse (Fallo esperado):** Abre tu navegador e intenta ingresar a `http://localhost:3000/portal` o `http://localhost:3000/admin`.
   * *Resultado esperado:* Redirección inmediata a `http://localhost:3000/portal/login`.
2. **Login de Cliente Obligado a Cambiar Contraseña:**
   * Crea un usuario con `debeCambiarPassword: true`.
   * Inicia sesión en `/portal/login`.
   * *Resultado esperado:* Redirección a `/portal/cambiar-password`. Cualquier intento de ir a `/portal` antes de realizar el cambio de contraseña debe redirigir de vuelta.
3. **Intento de Acceso a Admin con Rol Cliente (Fallo esperado):** Con la sesión de cliente activa, intenta acceder a `http://localhost:3000/admin`.
   * *Resultado esperado:* Denegación de acceso (Redirección al login o panel de cliente).

---


## Autenticación, Seguridad y Vistas

El sistema cuenta con un sistema de autenticación basado en **sesiones de servidor (express-session)** y vistas renderizadas en el servidor usando el motor de plantillas **Pug**.

### Configuración de Autenticación
* **Tipo**: Autenticación con Cookies y Sesión (Server-Side Session).
* **Configuración del Middleware**: Definido en index.js, configurando la sesión con una duración de 2 horas.
* **Justificación frente a JWT**:
  * **Acoplamiento con SSR (Pug)**: Dado que el servidor procesa y sirve páginas HTML completas, las cookies de sesión son la opción nativa y más fluida para el navegador.
  * **Seguridad (Mitigación XSS)**: Al no guardar información de tokens en `localStorage` o `sessionStorage` en el cliente, evitamos que scripts maliciosos accedan a las credenciales de sesión.
  * **Revocación inmediata**: Al hacer logout, la sesión se destruye en el servidor mediante `req.session.destroy()`, impidiendo cualquier acceso posterior de forma inmediata.

### Middlewares de Autorización
* **`requiereCliente`**: Valida que exista una sesión activa y que el rol del usuario sea `CLIENTE`. En caso contrario, redirige al login o al panel correspondiente.
* **`requiereAdmin`**: Valida que exista una sesión activa y que el rol del usuario sea `ADMIN`. Restringe el acceso al panel de administración.

### Endpoints de Vistas y Formularios (Pug)

#### Portal de Clientes (`/portal`)
* **`GET /portal/login`**: Muestra la vista de inicio de sesión.
* **`POST /portal/login`**: Valida las credenciales. Al autenticar, almacena la información del usuario en `req.session.usuario`.
* **`GET /portal/cambiar-password`**: Muestra la vista obligatoria para cambiar la contraseña provisorias en el primer ingreso.
* **`POST /portal/cambiar-password`**: Actualiza la contraseña en la base de datos y desactiva el requerimiento de cambio.
* **`GET /portal`**: Panel de inicio para clientes autenticados.
* **`GET /portal/nuevo-pedido`**: Carga el formulario de creación de pedidos asociando el cliente logueado.
* **`GET /portal/mis-pedidos`**: Lista cronológica de los pedidos pertenecientes al cliente actual.
* **`GET /portal/logout`**: Cierra y destruye la sesión del cliente, redirigiendo al login.

#### Panel de Administración (`/admin`)
* **`GET /admin`**: Inicio del panel de control de administración.
* **`GET /admin/pedidos`**: Lista de todos los pedidos del sistema con filtros dinámicos por `estado` y `cliente`.
* **`GET /admin/productos`**: Catálogo de productos para administración (con soporte de búsquedas).
* **`GET /admin/productos/nuevo`**: Vista del formulario de creación de productos.
* **`POST /admin/productos/nuevo`**: Procesa el guardado del nuevo producto en la base de datos.
* **`GET /admin/productos/:id/editar`**: Vista del formulario para editar un producto.
* **`POST /admin/productos/:id/editar`**: Procesa la actualización de los datos del producto.
* **`GET /admin/clientes/nuevo`**: Formulario de alta para nuevas sucursales o franquicias.
* **`GET /admin/usuarios/nuevo`**: Formulario de alta de nuevos usuarios asociados a un cliente.
* **`GET /admin/logout`**: Cierra y destruye la sesión del administrador.
