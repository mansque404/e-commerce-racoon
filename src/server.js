require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app'); 

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('ERRO: A variável de ambiente MONGO_URI não foi definida.');
    process.exit(1); 
}

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Conectado ao MongoDB com sucesso!');

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse a interface do usuário em http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Falha ao conectar com o MongoDB:', error);
        process.exit(1);
    }
};

startServer();