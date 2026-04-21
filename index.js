require("dotenv").config();
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;


const productoRoutes = require("./routes/productoRoutes");
const pedidosRoutes = require("./routes/pedidoRoutes");


app.use(express.json());
//middleware que puedr leer los datos enviados desde formularios HTML (method="POST").
app.use(express.urlencoded({ extended: true }));

// Configura el motor de vistas Pug
app.set("view engine", "pug");
app.set("views", "./views");

//permite servir archivos estáticos desde la carpeta public
app.use(express.static("public"));

// rutas
app.use("/productos", productoRoutes);
app.use("/pedidos", pedidosRoutes);

app.listen(PORT, () => {
    console.log("Servidor corriendo en puerto " + PORT);
});