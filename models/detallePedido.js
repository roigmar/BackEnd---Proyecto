class DetallePedido {
    constructor(productoId, nombreProducto, cantidad, precioUnitario) {
        this.productoId = productoId; // Referencia al módulo de Productos 
        this.nombreProducto = nombreProducto; 
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = cantidad * precioUnitario;
    }
}
module.exports = DetallePedido;