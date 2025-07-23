// src/services/cronJob.js
const cron = require('node-cron');
const db = require('../config/db');
const scrapingService = require('./scrapingService');
const emailService = require('./emailService');

// Função principal que verifica todos os preços
async function checkPrices() {
    console.log('⏰ Executando verificação de preços agendada...');
    try {
        // Busca todos os produtos que ainda não foram notificados
        const { rows: products } = await db.query('SELECT * FROM tracked_products WHERE is_notified = FALSE');

        for (const product of products) {
            try {
                // 1. Faz o scraping do preço atual
                const scrapedData = await scrapingService.scrapeProduct(product.product_url);
                if (!scrapedData) continue; // Pula para o próximo se o scraping falhar

                const currentPrice = scrapedData.price;

                // 2. Atualiza o preço atual e a data da verificação no banco
                await db.query(
                    'UPDATE tracked_products SET current_price = $1, last_checked = NOW() WHERE id = $2',
                    [currentPrice, product.id]
                );

                // 3. Compara o preço e envia o alerta, se necessário
                if (currentPrice <= parseFloat(product.target_price)) {
                    // Busca o e-mail do usuário
                    const { rows: [user] } = await db.query('SELECT email FROM users WHERE id = $1', [product.user_id]);
                    
                    if (user) {
                        // Envia o e-mail
                        await emailService.sendPriceAlert(user.email, { ...product, current_price: currentPrice });
                        
                        // 4. Marca como notificado para não enviar e-mails repetidos
                        await db.query('UPDATE tracked_products SET is_notified = TRUE WHERE id = $1', [product.id]);
                    }
                }
            } catch (error) {
                console.error(`Erro ao processar o produto ID ${product.id} (${product.product_url}):`, error.message);
            }
        }
    } catch (error) {
        console.error('Erro geral na tarefa agendada de verificação de preços:', error);
    }
    console.log('✅ Verificação de preços agendada concluída.');
}

// Exporta uma função para iniciar o agendamento
exports.start = () => {
    // Agenda a tarefa para rodar 'de hora em hora' (no minuto 0 de cada hora)
    cron.schedule('0 * * * *', checkPrices);
    console.log('🚀 Agendador de preços iniciado. A verificação ocorrerá a cada hora.');
};