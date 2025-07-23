// src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes'); // 1. Importe as rotas

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'PriceWatcher API está funcionando!' });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes); // 2. Use as rotas de produtos

module.exports = app;