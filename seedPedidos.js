import 'dotenv/config';
import mongoose from 'mongoose';
import Pedido from './models/pedido.js';
import Cliente from './models/cliente.js';
import Producto from './models/producto.js';
import { readFileSync } from 'fs';

const pedidosData = JSON.parse(readFileSync('./data/pedidos.json', 'utf-8'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');

    await Pedido.deleteMany();
    console.log('Colección de pedidos limpiada');

    for (const pedidoData of pedidosData) {
      const cliente = await Cliente.findOne({
        nombre: { $regex: new RegExp(`^${pedidoData.cliente}$`, 'i') }
      });

      if (!cliente) {
        console.warn(`Cliente no encontrado: ${pedidoData.cliente}`);
        continue;
      }

      const detallesProcesados = [];
      let total = 0;

      for (const detalle of pedidoData.detalles) {
        const producto = await Producto.findOne({
          nombre: { $regex: new RegExp(`^${detalle.nombreProducto}$`, 'i') }
        });

        if (!producto) {
          console.warn(`Producto no encontrado: ${detalle.nombreProducto}`);
          continue;
        }

        const subtotal = producto.precio * detalle.cantidad;
        detallesProcesados.push({
          productoId: producto._id,
          cantidad: detalle.cantidad,
          precioUnitario: producto.precio,
          subtotal
        });
        total += subtotal;
      }

      await Pedido.create({
        clienteId: cliente._id,
        detalles: detallesProcesados,
        fecha: pedidoData.fecha,
        total,
        estado: pedidoData.estado
      });

      console.log(`Pedido creado: ${pedidoData.cliente} - ${pedidoData.estado}`);
    }

    console.log('Seed de pedidos completado');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });