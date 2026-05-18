const mongoose = require('mongoose');
const { Schema } = mongoose;

const clienteSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },

    tipo: {
        type: String,
        enum: ['SUCURSAL', 'FRANQUICIA'],
        required: [true, 'El tipo es obligatorio (SUCURSAL o FRANQUICIA)']
    },

    configuracion_logistica: {
        direccion_entrega: {
            type: String,
            required: [true, 'La dirección de entrega es obligatoria']
        },
        zona_reparto: String,
        dias_entrega: [String], // Ej: ['Lunes', 'Miércoles']
        horario_limite_pedido: String
    },

    finanzas: {
        porcentaje_royalty: {
            type: Number,
            default: 0,
            required: function () { return this.tipo === 'FRANQUICIA'; }
        },
        cuit_facturacion: String,
        estado_cuenta: { type: Number, default: 0 }
    },

    // Relación con el sistema
    usuario_responsable: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    },

    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cliente', clienteSchema);
