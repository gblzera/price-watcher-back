// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Pega o header de autorização
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
    }

    // O header vem no formato "Bearer <token>". Vamos separar o token.
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token mal formatado.' });
    }

    try {
        // Verifica se o token é válido usando nosso segredo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adiciona o ID do usuário ao objeto `req` para que as próximas rotas possam usá-lo
        req.user = { id: decoded.userId };
        
        // Passa para o próximo passo (o controller da rota)
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};