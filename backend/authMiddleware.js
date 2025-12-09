const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'sua-chave-secreta-super-segura';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ erro: "Token de autenticação não fornecido." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ erro: "Token de autenticação inválido ou expirado." });
        }
        req.user = user; // Adiciona as informações do usuário (id, nome, role) ao objeto de requisição
        next();
    });
};

const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ erro: "Acesso negado. Você não tem permissão para realizar esta ação." });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};
