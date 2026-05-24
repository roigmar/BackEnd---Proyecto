# Panificadora Industrial "La Espiga de Oro S.R.L." - Backend API

Este proyecto es el backend para el sistema de gestión de la panificadora "La Espiga de Oro S.R.L.". Permite la administración del catálogo de productos y la gestión integral de pedidos para las diferentes sucursales y franquicias.

## Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias:
```bash
   npm install
```
3. Crear el archivo `.env` en la raíz del proyecto con las variables de entorno necesarias:
```dotenv
PORT=3000
MONGO_URI=mongodb://localhost:27017/la-espiga-de-oro
```
4. Asegurarse de tener **MongoDB Community Server** instalado y corriendo localmente. Descarga: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

5. Cargar los datos iniciales ejecutando los seeds en este orden:
```bash
node seed.js
node seedClientes.js
node seedUsuarios.js
node seedPedidos.js
```

6. Iniciar el servidor:
```bash
   npm run dev
```
   *El servidor se iniciará en el puerto especificado en el archivo `.env` o en el 3000 por defecto.*

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

A continuación, se detallan las estructuras JSON y las rutas necesarias para probar los endpoints principales.

### Módulo de Productos

**1. Alta de Producto (`POST /productos`)**
- **Body (JSON):**
```json
  {
    "nombre": "Medialunas de manteca",
    "precio": 800,
    "descripcion": "Docena de medialunas dulces.",
    "stock": 50
  }
```

**2. Actualizar Producto (`PATCH /productos/:id`)**
- **Body (JSON):**
```json
  {
    "precio": 900,
    "stock": 40
  }
```
- **Nota:** Solo se actualizan los campos enviados. Los demás conservan su valor.

**3. Eliminación de Producto (`DELETE /productos/:id`)**
- **Body:** *No requiere Body.*
- **Nota:** No se puede eliminar si el producto forma parte de un pedido con estado "pendiente".

### Módulo de Clientes

**1. Alta de Cliente (`POST /clientes`)**
- **Body (JSON):**
```json
  {
    "nombre": "Franquicia Tigre",
    "tipo": "FRANQUICIA",
    "configuracion_logistica": {
      "direccion_entrega": "Av. Cazón 1000, Tigre, GBA",
      "zona_reparto": "Tigre",
      "dias_entrega": ["Lunes", "Jueves"],
      "horario_limite_pedido": "16:00"
    },
    "finanzas": {
      "porcentaje_royalty": 8,
      "cuit_facturacion": "20-11111111-1"
    }
  }
```

### Módulo de Pedidos

**1. Alta de Pedido (`POST /pedidos`)**
- **Body (JSON):**
```json
  {
    "clienteId": "<_id del cliente>",
    "detalles": [
      {
        "productoId": "<_id del producto>",
        "cantidad": 10
      },
      {
        "productoId": "<_id del producto>",
        "cantidad": 5
      }
    ]
  }
```
- **Nota:** `clienteId` y los `productoId` deben ser `_id` válidos de MongoDB. El precio y subtotal se calculan automáticamente desde la base de datos.

**2. Actualizar Estado de Pedido (`PATCH /pedidos/:id/estado`)**
- **Body (JSON):**
```json
  {
    "estado": "en producción"
  }
```
- **Nota:** Los estados válidos en orden secuencial son: `pendiente` -> `en producción` -> `despachado` -> `entregado`.