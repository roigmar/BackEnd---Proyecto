require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Cliente = require('./models/cliente');
const Usuario = require('./models/usuario');
const usuariosData = require('./data/usuarios.json');

function hashPassword(plain) {
    return crypto.createHash('sha256').update(plain).digest('hex');
}

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB\n');

        const totalClientes = await Cliente.countDocuments();
        if (totalClientes === 0) {
            console.error('❌ No hay clientes en la base de datos.');
            console.error('   Ejecutá primero: node seedClientes.js\n');
            return mongoose.connection.close();
        }

        await Usuario.deleteMany();
        console.log('🗑️  Colección de usuarios limpiada.\n');

        const resultados = [];
        const errores = [];

        for (const dato of usuariosData) {
            const docUsuario = {
                usuario: dato.usuario,
                password: hashPassword(dato.passwordPlain),
                rol: dato.rol,
                activo: true
            };

            // Solo los CLIENTE necesitan clienteId
            if (dato.rol === 'CLIENTE') {
                const cliente = await Cliente.findOne({ nombre: dato.clienteNombre });
                if (!cliente) {
                    errores.push(`  ⚠️  Cliente no encontrado: "${dato.clienteNombre}"`);
                    continue;
                }
                docUsuario.clienteId = cliente._id;
                resultados.push({ usuario: dato.usuario, rol: dato.rol, nombre: cliente.nombre, tipo: cliente.tipo });
            } else {
                resultados.push({ usuario: dato.usuario, rol: dato.rol, nombre: '—', tipo: 'ADMIN' });
            }

            await new Usuario(docUsuario).save();
        }

        console.log(`✅ ${resultados.length} usuarios creados:\n`);
        resultados.forEach(r => {
            console.log(`   [${r.tipo}] usuario: ${r.usuario.padEnd(25)} → ${r.nombre}`);
        });

        if (errores.length > 0) {
            console.log('\n⚠️  Advertencias:');
            errores.forEach(e => console.log(e));
        }

        console.log('\n📋 Credenciales de acceso:');
        console.log('─'.repeat(55));
        usuariosData.forEach(d => {
            const tipo = d.rol === 'ADMIN' ? 'ADMIN   ' : d.clienteNombre?.split(' ')[0];
            console.log(`   ${d.usuario.padEnd(28)} | ${d.passwordPlain.padEnd(14)} | ${tipo}`);
        });
        console.log('─'.repeat(55));

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        mongoose.connection.close();
    });
