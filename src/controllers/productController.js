// src/controllers/productController.js
const db = require('../config/db');
const scrapingService = require('../services/scrapingService'); // 1. Importe o serviço

// Adicionar um produto para monitoramento
exports.addProduct = async (req, res) => {
    const { product_url, target_price } = req.body;
    const userId = req.user.id;

    if (!product_url || !target_price) {
        return res.status(400).json({ error: 'URL do produto e preço alvo são obrigatórios.' });
    }

    try {
        // 2. Chame o serviço de scraping ANTES de salvar no banco
        const scrapedData = await scrapingService.scrapeProduct(product_url);
        
        if (!scrapedData) {
            return res.status(400).json({ error: 'Não foi possível obter os dados do produto da URL fornecida.' });
        }

        const { name, price } = scrapedData;
        
        // 3. Salve os dados completos no banco de dados
        const result = await db.query(
            `INSERT INTO tracked_products(user_id, product_url, target_price, product_name, current_price, last_checked) 
             VALUES($1, $2, $3, $4, $5, NOW()) 
             RETURNING *`,
            [userId, product_url, target_price, name, price]
        );

        res.status(201).json({
            message: 'Produto adicionado e preço inicial verificado!',
            product: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        // Retorna o erro específico do scraping se houver
        if (error.message.includes('Falha ao obter dados')) {
             return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erro no servidor ao tentar adicionar o produto.' });
    }
};

// ... a função listProducts continua igual ...
exports.listProducts = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query('SELECT * FROM tracked_products WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor ao tentar listar os produtos.' });
    }
};

// Deletar um produto monitorado
exports.deleteProduct = async (req, res) => {
    const { id } = req.params; // ID do produto a ser deletado
    const userId = req.user.id; // ID do usuário logado

    try {
        const result = await db.query(
            'DELETE FROM tracked_products WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        // Se a query não retornar nada, o produto não existe ou não pertence ao usuário
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado ou você não tem permissão para deletá-lo.' });
        }

        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor ao tentar deletar o produto.' });
    }
};

// Atualizar o preço alvo de um produto
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { target_price } = req.body;
    const userId = req.user.id;

    if (!target_price) {
        return res.status(400).json({ error: 'O novo preço alvo é obrigatório.' });
    }

    try {
        const result = await db.query(
            // Também resetamos 'is_notified' para que o usuário possa ser alertado novamente com o novo preço
            'UPDATE tracked_products SET target_price = $1, is_notified = FALSE WHERE id = $2 AND user_id = $3 RETURNING *',
            [target_price, id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Produto não encontrado ou você não tem permissão para atualizá-lo.' });
        }

        res.status(200).json({ 
            message: 'Preço alvo atualizado com sucesso!',
            product: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor ao tentar atualizar o produto.' });
    }
};

