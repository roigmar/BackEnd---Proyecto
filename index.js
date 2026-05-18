require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado a MongoDB con éxito"))
    .catch((err) => console.error("Error al conectar a MongoDB:", err));

const productoRoutes = require("./routes/productoRoutes");
const pedidosRoutes = require("./routes/pedidoRoutes");
const clienteRoutes = require("./routes/clienteRoutes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura el motor de vistas Pug
app.set("view engine", "pug");
app.set("views", "./views");

// Permite servir archivos estáticos desde la carpeta public
app.use(express.static("public"));

// Rutas
app.use("/productos", productoRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/clientes", clienteRoutes);

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