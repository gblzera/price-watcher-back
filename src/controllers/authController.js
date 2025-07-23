// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Função de Registro
exports.register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email',
            [email, passwordHash]
        );

        res.status(201).json({
            message: 'Usuário registrado com sucesso!',
            user: result.rows[0],
        });
    } catch (error) {
        // Trata o erro de email duplicado (código 23505 no PostgreSQL)
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Este email já está em uso.' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor ao tentar registrar.' });
    }
};

// Função de Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { userId: user.id }, // Payload: informações que o token carregará
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expira em 1 hora
        );

        res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no servidor ao tentar fazer login.' });
    }
};