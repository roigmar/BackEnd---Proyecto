const mongoose = require('mongoose');

const detallePedidoSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const pedidoSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true
    },
    detalles: {
      type: [detallePedidoSchema],
      required: true,
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'El pedido debe incluir al menos un detalle'
      }
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    estado: {
      type: String,
      enum: ['pendiente', 'en producción', 'despachado', 'entregado'],
      default: 'pendiente'
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model('Pedido', pedidoSchema);
