// src/services/scrapingService.js
const axios = require('axios');
const cheerio = require('cheerio');

// Objeto de configuração para cada site suportado
// Adicionar um novo site é tão simples quanto adicionar uma nova entrada aqui.
const siteConfigs = {
    'kabum.com.br': {
        nameSelector: 'h1',
        priceSelector: 'h4[class*="text-secondary-500"]',
        // Função específica para limpar o preço da Kabum!
        cleanPrice: (priceText) => {
            if (!priceText) return null;
            return priceText.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
        },
    },
    'amazon.com.br': {
        nameSelector: 'span#productTitle',
        priceSelector: 'span.a-price-whole',
        fractionSelector: 'span.a-price-fraction',
        // A Amazon divide o preço, então a limpeza é diferente.
        cleanPrice: (priceText, fractionText) => {
            if (!priceText || !fractionText) return null;
            const whole = priceText.replace(/\./g, '').replace(',', '').trim();
            const fraction = fractionText.trim();
            return `${whole}.${fraction}`;
        },
    },
    'mercadolivre.com.br': {
        nameSelector: 'h1.ui-pdp-title',
        priceSelector: 'span.andes-money-amount__fraction',
        // O Mercado Livre já entrega o preço principal no seletor.
        cleanPrice: (priceText) => {
            if (!priceText) return null;
            return priceText.replace(/\./g, '').trim();
        },
    }
    // Adicione outros sites aqui no futuro!
};

/**
 * Função principal de scraping, agora capaz de lidar com múltiplos domínios.
 * @param {string} productUrl - A URL do produto a ser verificado.
 * @returns {Promise<{name: string, price: number}>} - Um objeto com o nome e o preço numérico do produto.
 */
exports.scrapeProduct = async (productUrl) => {
    try {
        const url = new URL(productUrl);
        // Normaliza o domínio para funcionar com ou sem 'www.'
        const domain = url.hostname.replace('www.', '');

        const config = siteConfigs[domain];
        if (!config) {
            throw new Error(`O domínio ${domain} não é suportado no momento.`);
        }

        // Cabeçalho para simular um navegador e evitar bloqueios simples
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        };

        const { data } = await axios.get(productUrl, { headers });
        const $ = cheerio.load(data);

        const name = $(config.nameSelector).first().text().trim();
        let priceText = $(config.priceSelector).first().text().trim();
        let numericPrice;

        // Lógica específica para a Amazon que tem o preço dividido
        if (domain === 'amazon.com.br') {
            const fractionText = $(config.fractionSelector).first().text().trim();
            priceText = config.cleanPrice(priceText, fractionText);
        } else {
            priceText = config.cleanPrice(priceText);
        }

        numericPrice = parseFloat(priceText);

        if (!name || isNaN(numericPrice)) {
            console.error(`Falha nos seletores para ${domain}. Nome: '${name}', Preço: '${priceText}'`);
            throw new Error('Não foi possível encontrar o nome ou o preço do produto. O site pode ter atualizado.');
        }

        return { name, price: numericPrice };

    } catch (error) {
        console.error(`Erro detalhado ao fazer scraping de ${productUrl}:`, error.message);
        throw new Error(`Falha ao obter dados do produto. Verifique a URL ou os seletores para o domínio.`);
    }
};
