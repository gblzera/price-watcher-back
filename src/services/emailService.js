// src/services/emailService.js
const nodemailer = require('nodemailer');

// Configura o "transportador" de email usando as credenciais do .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Função para enviar o alerta de preço
exports.sendPriceAlert = async (userEmail, product) => {
    const mailOptions = {
        from: `"📉 PriceWatcher" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Alerta de Preço! ${product.product_name}`,
        html: `
            <h1>Preço Atingido!</h1>
            <p>O produto que você está monitorando atingiu o preço desejado.</p>
            <hr>
            <p><strong>Produto:</strong> ${product.product_name}</p>
            <p><strong>Preço Atual:</strong> R$ ${product.current_price.toFixed(2)}</p>
            <p><strong>Seu Preço Alvo:</strong> R$ ${product.target_price}</p>
            <hr>
            <p>Aproveite e compre agora!</p>
            <a href="${product.product_url}" target="_blank"><strong>Ir para a página do produto</strong></a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail de alerta enviado para ${userEmail} sobre ${product.product_name}`);
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail para ${userEmail}:`, error);
    }
};