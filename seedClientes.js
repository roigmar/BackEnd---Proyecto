import 'dotenv/config';
import mongoose from 'mongoose';
import Cliente from './models/cliente.js';
import { readFileSync } from 'fs';

const clientes = JSON.parse(readFileSync('./data/clientes.json', 'utf-8'));

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB');

        await Cliente.deleteMany();
        const insertados = await Cliente.insertMany(clientes);

        console.log(`${insertados.length} clientes cargados correctamente:`);
        insertados.forEach(c => {
            console.log(`   [${c.tipo}] ${c.nombre} → _id: ${c._id}`);
        });

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });