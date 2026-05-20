require('dotenv').config();
const mongoose = require('mongoose');
const Cliente = require('./models/cliente');
const clientes = require('./data/clientes.json');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Conectado a MongoDB');

        await Cliente.deleteMany(); // Limpia la colección antes de insertar
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
