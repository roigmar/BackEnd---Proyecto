import 'dotenv/config';
import mongoose from 'mongoose';
import Cliente from './models/cliente.js';
import Usuario from './models/usuario.js';
import { readFileSync } from 'fs';

const usuariosData = JSON.parse(readFileSync('./data/usuarios.json', 'utf-8'));

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB\n');

        const totalClientes = await Cliente.countDocuments();
        if (totalClientes === 0) {
            console.error('No hay clientes en la base de datos.');
            console.error('Ejecutá primero: node seedClientes.js\n');
            return mongoose.connection.close();
        }

        await Usuario.deleteMany();
        console.log('Colección de usuarios limpiada.\n');

        const resultados = [];
        const errores = [];

        for (const dato of usuariosData) {
            const docUsuario = {
                usuario:  dato.usuario,
                password: dato.passwordPlain,
                rol:      dato.rol,
                activo:   true
            };

            if (dato.rol === 'CLIENTE') {
                const cliente = await Cliente.findOne({ nombre: dato.clienteNombre });
                if (!cliente) {
                    errores.push(`Cliente no encontrado: "${dato.clienteNombre}"`);
                    continue;
                }
                docUsuario.clienteId = cliente._id;
                resultados.push({ usuario: dato.usuario, rol: dato.rol, nombre: cliente.nombre, tipo: cliente.tipo });
            } else {
                resultados.push({ usuario: dato.usuario, rol: dato.rol, nombre: '—', tipo: 'ADMIN' });
            }

            await new Usuario(docUsuario).save();
        }

        console.log(`${resultados.length} usuarios creados:\n`);
        resultados.forEach(r => {
            console.log(`[${r.tipo}] ${r.usuario.padEnd(28)} → ${r.nombre}`);
        });

        if (errores.length > 0) {
            console.log('\nAdvertencias:');
            errores.forEach(e => console.log(e));
        }

        console.log('\nCredenciales de acceso:');
        console.log('─'.repeat(55));
        usuariosData.forEach(d => {
            console.log(`${d.usuario.padEnd(28)} | ${d.passwordPlain}`);
        });
        console.log('─'.repeat(55));

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });
