import 'dotenv/config';
import mongoose from 'mongoose';
import Producto from './models/producto.js';
import { readFileSync } from 'fs';

const productos = JSON.parse(readFileSync('./data/productos.json', 'utf-8'));

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