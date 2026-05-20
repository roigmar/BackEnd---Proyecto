## 2. Módulo de Clientes (Sucursales y Franquicias) - [ANDREA]

Este módulo permitirá registrar quién realiza los pedidos.

- [x] Crear el modelo `Cliente.js` con Mongoose (campos: nombre, dirección, tipo [Sucursal/Franquicia], contacto).
- [x] Desarrollar el controlador `clienteController.js` con las operaciones CRUD (Crear, Leer, Actualizar, Eliminar).
- [x] Implementar validaciones para asegurar que los datos obligatorios estén presentes.
- [x] Crear las rutas en `clienteRoutes.js` y registrarlas en `index.js`.

---

## 3. Módulo de Productos - [MARCELA]

Migrar el manejo de productos de JSON a MongoDB.

- [x] Convertir el modelo `producto.js` de clase a Esquema de Mongoose.
- [x] Refactorizar `productoController.js` para usar métodos de Mongoose (`find`, `create`, `findByIdAndUpdate`, etc.).
- [x] Interacción: Agregar validación para que no se pueda eliminar un producto si tiene pedidos asociados (lógica de negocio).
- [x] Actualizar las rutas de productos para soportar la nueva lógica asincrónica.

---

## 4. Módulo de Pedidos e Interacciones - [LUCAS]

El núcleo del sistema donde interactúan los productos y los clientes.

- [x] Convertir el modelo `pedido.js` a Esquema de Mongoose utilizando Refs hacia Clientes y subdocumentos para los detalles de productos.
- [ ] Refactorizar `pedidoController.js`:
  - [ ] Validación: Al crear un pedido, verificar que el `clienteId` exista en la base de datos.
  - [ ] Validación: Verificar que los `productoId` existan y tengan stock suficiente.
  - [ ] Implementar la función de lectura que incluya (`populate`) los datos del cliente y los nombres de los productos.
- [x] Implementar lógica de actualización de estados (Pendiente → En Producción → Despachado → Entregado).