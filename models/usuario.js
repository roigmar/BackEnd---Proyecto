import mongoose from 'mongoose';
import crypto from 'crypto';
const { Schema } = mongoose;

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

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
    },
    debeCambiarPassword: {
    type: Boolean,
    default: false
}
}, {
    timestamps: true
});

// Hashear la contraseña antes de guardar si viene en claro
usuarioSchema.methods.setPassword = function (plainPassword) {
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.pbkdf2Sync(plainPassword, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    this.password = `pbkdf2$${ITERATIONS}$${salt}$${derived}`;
};

usuarioSchema.methods.validatePassword = function (plainPassword) {
    if (!this.password || typeof this.password !== 'string') return false;
    if (!this.password.startsWith('pbkdf2$')) return false;
    const parts = this.password.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const hash = parts[3];
    const derived = crypto.pbkdf2Sync(plainPassword, salt, iterations, Buffer.from(hash, 'hex').length, DIGEST).toString('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
    } catch (e) {
        return false;
    }
};
usuarioSchema.pre('save', function () {
    if (!this.isModified('password')) return;

    if (
        typeof this.password === 'string' &&
        this.password.startsWith('pbkdf2$')
    ) {
        return;
    }

    this.setPassword(this.password);
});

export default mongoose.model('Usuario', usuarioSchema);
