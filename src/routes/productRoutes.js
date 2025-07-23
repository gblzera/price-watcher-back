// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicamos o middleware de autenticação a todas as rotas de produtos
// Qualquer requisição para /products/* precisará de um token válido
router.use(authMiddleware);

// Rota para adicionar um produto (POST /products)
router.post('/', productController.addProduct);

// Rota para listar os produtos (GET /products)
router.get('/', productController.listProducts);

// Adicione estas duas rotas
// Rota para atualizar um produto (PUT /products/:id)
router.put('/:id', productController.updateProduct);

// Rota para deletar um produto (DELETE /products/:id)
router.delete('/:id', productController.deleteProduct);

module.exports = router;