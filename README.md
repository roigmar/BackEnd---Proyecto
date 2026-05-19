# Panificadora Industrial "La Espiga de Oro S.R.L." - Backend API

Este proyecto es el backend para el sistema de gestión de la panificadora "La Espiga de Oro S.R.L.". Permite la administración del catálogo de productos y la gestión integral de pedidos para las diferentes sucursales y franquicias.

## Instalación y Ejecución

1. Clonar el repositorio.
2. Instalar las dependencias:
```bash
   npm install
```
3. Crear el archivo `.env` en la raíz del proyecto con las variables de entorno necesarias.
   Los valores se encuentran en el siguiente documento compartido:
   [Variables de entorno - Google Drive](https://docs.google.com/document/d/1mzmFGqIf4aiWuOfrQrRwfW1ny33kAwyjvdxD9SOe7Tk/edit?usp=sharing)

4. Iniciar el servidor:
```bash
   npm run dev
```
   *El servidor se iniciará en el puerto especificado en el archivo `.env` o en el 3000 por defecto.*

## Documentación de Controladores

La API está dividida en dos módulos principales controlados por sus respectivos archivos:

### `productoController.js` (Gestión del Catálogo)
Este controlador gestiona todo el catálogo de productos de "La Espiga de Oro", asegurando que los datos se guarden correctamente en `data/productos.json` y controlando las dependencias con los pedidos.

* **`crearProducto(req, res)`:**
  * **Lógica:** Valida que el `body` incluya todos los campos necesarios (nombre, precio, descripción, stock) y que los tipos de datos sean correctos. Verifica que no exista un producto con el mismo nombre. Si todo es correcto, genera un ID autoincremental, instancia la clase `Producto`, lo agrega a la lista y reescribe el archivo `productos.json`.
* **`obtenerProductos(req, res)`:**
  * **Lógica:** Lee el contenido de `productos.json`, lo parsea y devuelve el array completo como respuesta.
* **`obtenerProductoPorId(req, res)`:**
  * **Lógica:** Recibe un `id` por parámetro. Busca dentro del arreglo de productos cuál coincide. Si no existe, devuelve un error `404`. Si existe, devuelve su información.
* **`actualizarProducto(req, res)`:**
  * **Lógica:** Busca el producto por `id`. Si lo encuentra, sobrescribe sus propiedades (`nombre`, `precio`, `descripcion`, `stock`) manteniendo la estructura original intacta. Finalmente, guarda los cambios en el JSON.
* **`eliminarProducto(req, res)`:**
  * **Lógica:** Aplica **validación cruzada entre módulos**. Antes de eliminar, lee `pedidos.json`. Verifica que el producto **no esté incluido en ningún pedido que tenga estado "pendiente"**. Si está en un pedido pendiente, bloquea la eliminación para mantener la consistencia de los datos. Si no hay conflicto, remueve el producto del arreglo y actualiza el JSON.

### `pedidoController.js` (Gestión de Pedidos)
Este controlador administra el flujo de pedidos de las franquicias y sucursales, guardando los datos en `data/pedidos.json`.

* **`crearPedido(req, res)`:**
  * **Lógica:** Verifica que haya un cliente válido y que el tipo de cliente sea estrictamente `"Sucursal"` o `"Franquicia"`. Procesa el arreglo de `detalles`. Por cada ítem, busca el producto en `productos.json` para asegurar que el ID exista, extrae el precio y el nombre del producto, y genera instancias de `DetallePedido`. Crea la instancia del `Pedido` (que internamente se inicializa como `"pendiente"` y calcula su total) y lo guarda en `pedidos.json`.
* **`obtenerPedidos(req, res)`:**
  * **Lógica:** Lee `pedidos.json` y lo devuelve. Esto sirve para el Dashboard general.
* **`obtenerPedidoPorId(req, res)`:**
  * **Lógica:** Recibe el `id` por parámetro, lo busca y retorna toda la estructura del pedido incluyendo sus detalles y totales.
* **`actualizarEstadoPedido(req, res)`:**
  * **Lógica:** Gestiona el **flujo de estados** de un pedido. Recibe el nuevo estado y aplica una regla de negocio estricta limitando las transiciones válidas:
    * De *pendiente* **sólo** puede pasar a *en producción*.
    * De *en producción* **sólo** puede pasar a *despachado*.
    * De *despachado* **sólo** puede pasar a *entregado*.
  * Si el estado solicitado rompe esta secuencia, lanza un error `400`. Si es válido, actualiza el estado y guarda el JSON.

## Guía de Pruebas

A continuación, se detallan las estructuras JSON y las rutas necesarias para probar los endpoints principales.

### Módulo de Productos

**1. Alta de Producto (`POST /productos`)**
- **Body (JSON):**
  ```json
  {
    "nombre": "Medialunas de manteca",
    "precio": 500,
    "descripcion": "Docena de medialunas dulces.",
    "stock": 50
  }
  ```

**2. Eliminación de Producto (`DELETE /productos/:id`)**
- **Body:** *No requiere Body.*
- **Nota:** No se puede eliminar si el producto forma parte de un pedido con estado "pendiente".

### Módulo de Pedidos

**1. Alta de Pedido (`POST /pedidos`)**
- **Body (JSON):**
  ```json
  {
    "cliente": "Sucursal Centro",
    "tipoCliente": "Sucursal",
    "detalles": [
      {
        "productoId": 1,
        "cantidad": 10
      },
      {
        "productoId": 2,
        "cantidad": 5
      }
    ]
  }
  ```
- **Nota:** `tipoCliente` solo acepta `"Sucursal"` o `"Franquicia"`. Los `productoId` indicados en los detalles deben existir previamente en la base de productos.

**2. Actualizar Estado de Pedido (`PATCH /pedidos/:id/estado`)**
- **Body (JSON):**
  ```json
  {
    "estado": "en producción"
  }
  ```
- **Nota:** Los estados válidos en orden secuencial son: `pendiente` -> `en producción` -> `despachado` -> `entregado`.
