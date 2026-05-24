import mongoose from 'mongoose';
const { Schema } = mongoose;

const usuarioSchema = new Schema({
    usuario: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },

    // Rol del usuario en el sistema
    rol: {
        type: String,
        enum: ['ADMIN', 'CLIENTE'],
        required: [true, 'El rol es obligatorio'],
        default: 'CLIENTE'
    },

    // Solo obligatorio para usuarios de tipo CLIENTE
    clienteId: {
        type: Schema.Types.ObjectId,
        ref: 'Cliente',
        required: function () { return this.rol === 'CLIENTE'; }
    },

    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Usuario', usuarioSchema);
