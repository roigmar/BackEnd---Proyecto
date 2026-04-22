class Pedido {
    constructor(id, cliente,tipoCliente, detalles = [], fecha, estado = 'pendiente') {
        this.id = id;
        this.cliente = cliente;
        this.tipoCliente = tipoCliente; // Ver si se referencia si es franquicia o sucursal
        this.detalles = detalles; // Array de objetos DetallePedido
        this.fecha = fecha || new Date();
        this.total = detalles.reduce((acc, item) => acc + item.subtotal, 0);
        this.estado = estado;
    }
}
module.exports = Pedido;