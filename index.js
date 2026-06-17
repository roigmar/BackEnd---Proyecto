import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';

import productoRoutes from './routes/productoRoutes.js';
import pedidosRoutes from './routes/pedidoRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a MongoDB con éxito"))
    .catch((err) => console.error("Error al conectar a MongoDB:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'la-espiga-de-oro-secret-key-123456',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set to true in production with HTTPS
        maxAge: 1000 * 60 * 60 * 2 // 2 horas de duración
    }
}));

// Exponer la sesión a las vistas Pug
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Configura el motor de vistas Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Permite servir archivos estáticos desde la carpeta public
app.use(express.static("public"));

// Rutas
app.use("/productos", productoRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/clientes", clienteRoutes);
app.use("/portal",   portalRoutes);
app.use("/admin",    adminRoutes);
app.use("/usuarios", usuarioRoutes);

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || "Error interno del servidor",
            status: status
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});