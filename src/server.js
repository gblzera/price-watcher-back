// src/server.js
const app = require('./app');
const cronJob = require('./services/cronJob'); // 1. Importe o cronJob

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    
    // 2. Inicie o agendador
    cronJob.start();
});