require('dotenv').config();
const mongoose = require('mongoose');
const Producto = require('./models/producto');
const productos = require('./data/productos.json');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB');

        await Producto.deleteMany(); // Limpia la colección antes de insertar
        await Producto.insertMany(productos.map(({ nombre, precio, descripcion, stock }) => ({
            nombre, precio, descripcion, stock
        })));

        console.log('Productos cargados correctamente');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });