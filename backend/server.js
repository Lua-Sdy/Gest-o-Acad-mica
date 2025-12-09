require("dotenv").config({ path: require('path').join(__dirname, '.env') });
const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const { authenticateToken, authorizeRoles } = require('./authMiddleware'); // Adicionar esta linha

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

const SECRET_KEY = process.env.SECRET_KEY || 'sua-chave-secreta-super-segura';

// ============================
// CONEXÃO MYSQL
// ============================
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306 // Corrigido: converte para número
});

db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
    } else {
        console.log("Conectado ao MySQL com sucesso!");
    }
});

// ============================
// ROTA CADASTRO DE USUÁRIO (PÚBLICA)
// ============================
app.post('/usuarios', async (req, res) => {
    const { nome_completo, email, senha, role } = req.body;

    if (!nome_completo || !email || !senha || !role) {
        return res.status(400).json({ erro: "Preencha todos os campos!" });
    }

    const rolesValidos = ['admin', 'professor', 'coordinator'];
    if (!rolesValidos.includes(role)) {
        return res.status(400).json({ erro: `Role inválida. Valores válidos: ${rolesValidos.join(', ')}` });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        const sql = "INSERT INTO usuario (email, nome_completo, senha, role) VALUES (?, ?, ?, ?)";
        db.query(sql, [email, nome_completo, senhaHash, role], (err, results) => { // <-- ADICIONADO 'results'
            if (err) {
                console.error(err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ erro: "Este email já está cadastrado." });
                }
                return res.status(500).json({ erro: "Erro ao conectar o banco de dados ou cadastrar usuário" });
            }

            res.status(201).json({ mensagem: "Usuário cadastrado com sucesso", id_usuario: results.insertId }); // OK agora
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// ============================
// LOGIN (PÚBLICA)
// ============================
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const sql = "SELECT * FROM usuario WHERE email=?";
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ erro: "Erro ao conectar no banco de dados" });
        if (results.length === 0) return res.status(400).json({ erro: "Usuário não encontrado" });

        const usuario = results[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) return res.status(400).json({ erro: "Senha incorreta!" });

        const token = jwt.sign(
            { id: usuario.id_usuario, nome: usuario.nome_completo, role: usuario.role },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            mensagem: "Login efetuado com sucesso",
            token: token
        });
    });
});

// ============================
// ROTAS PROTEGIDAS A PARTIR DAQUI
// ============================

// ============================
// USUÁRIO (CRUD - PROTEGIDO)
// ============================

// Obter todos os usuários (apenas admin)
app.get('/usuarios', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const sql = "SELECT id_usuario, email, nome_completo, role FROM usuario";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err);
            return res.status(500).json({ erro: "Erro ao buscar usuários" });
        }
        res.status(200).json(results);
    });
});

// Obter um único usuário por ID (apenas admin ou o próprio usuário)
app.get('/usuarios/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // Permite que um admin veja qualquer usuário ou que o próprio usuário veja seus dados
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ erro: "Acesso negado. Você não tem permissão para ver este usuário." });
    }
    const sql = "SELECT id_usuario, email, nome_completo, role FROM usuario WHERE id_usuario = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar usuário:", err);
            return res.status(500).json({ erro: "Erro ao buscar usuário" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar usuário (apenas admin ou o próprio usuário)
app.put('/usuarios/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { nome_completo, email, senha, role } = req.body;

    // Permite que um admin edite qualquer usuário ou que o próprio usuário edite seus dados
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ erro: "Acesso negado. Você não tem permissão para editar este usuário." });
    }

    // Se não for admin, não pode mudar a role de ninguém, nem a própria
    if (req.user.role !== 'admin' && role && role !== req.user.role) {
        return res.status(403).json({ erro: "Acesso negado. Você não pode alterar a role do usuário." });
    }
    // Se for admin, pode mudar a role, mas deve ser uma role válida
    if (role && req.user.role === 'admin') {
        const rolesValidos = ['admin', 'professor', 'coordinator'];
        if (!rolesValidos.includes(role)) {
            return res.status(400).json({ erro: `Role inválida. Valores válidos: ${rolesValidos.join(', ')}` });
        }
    }

    let updateFields = [];
    let queryParams = [];

    if (nome_completo) {
        updateFields.push("nome_completo = ?");
        queryParams.push(nome_completo);
    }
    if (email) {
        updateFields.push("email = ?");
        queryParams.push(email);
    }
    if (senha) {
        const senhaHash = await bcrypt.hash(senha, 10);
        updateFields.push("senha = ?");
        queryParams.push(senhaHash);
    }
    if (role && req.user.role === 'admin') { // Apenas admin pode atualizar a role
        updateFields.push("role = ?");
        queryParams.push(role);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE usuario SET ${updateFields.join(', ')} WHERE id_usuario = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar usuário:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: "Este email já está cadastrado para outro usuário." });
            }
            return res.status(500).json({ erro: "Erro ao atualizar usuário" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Usuário atualizado com sucesso." });
    });
});

// Deletar usuário (apenas admin)
app.delete('/usuarios/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM usuario WHERE id_usuario = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar usuário:", err);
            // Considerar erros de chave estrangeira aqui
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar este usuário pois ele está vinculado a outras entidades (ex: professor)." });
            }
            return res.status(500).json({ erro: "Erro ao deletar usuário" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        res.status(200).json({ mensagem: "Usuário deletado com sucesso." });
    });
});


// ============================
// CURSO (CRUD - PROTEGIDO)
// ============================

// Criar Curso (apenas admin)
app.post('/cursos', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { nome_curso, carga_horaria, area, descricao } = req.body;

    if (!nome_curso || !carga_horaria || !area || !descricao) {
        return res.status(400).json({ erro: "Preencha todos os campos: nome_curso, carga_horaria, area, descricao." });
    }

    const sql = "INSERT INTO curso (nome_curso, carga_horaria, area, descricao) VALUES (?, ?, ?, ?)";
    db.query(sql, [nome_curso, carga_horaria, area, descricao], (err, results) => {
        if (err) {
            console.error("Erro ao cadastrar curso:", err);
            return res.status(500).json({ erro: "Erro ao cadastrar curso" });
        }
        res.status(201).json({ mensagem: "Curso cadastrado com sucesso", id_curso: results.insertId });
    });
});

// Obter todos os cursos (todos autenticados)
app.get("/cursos", authenticateToken, (req, res) => {
    const sql = "SELECT id_curso, nome_curso, carga_horaria, area, descricao FROM curso";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar cursos:", err);
            return res.status(500).json({ erro: "Erro ao buscar cursos" });
        }
        res.status(200).json(results);
    });
});

// Obter um único curso por ID (todos autenticados)
app.get("/cursos/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id_curso, nome_curso, carga_horaria, area, descricao FROM curso WHERE id_curso = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar curso:", err);
            return res.status(500).json({ erro: "Erro ao buscar curso" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Curso (apenas admin)
app.put('/cursos/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { nome_curso, carga_horaria, area, descricao } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (nome_curso) {
        updateFields.push("nome_curso = ?");
        queryParams.push(nome_curso);
    }
    if (carga_horaria !== undefined) {
        updateFields.push("carga_horaria = ?");
        queryParams.push(carga_horaria);
    }
    if (area) {
        updateFields.push("area = ?");
        queryParams.push(area);
    }
    if (descricao) {
        updateFields.push("descricao = ?");
        queryParams.push(descricao);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE curso SET ${updateFields.join(', ')} WHERE id_curso = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar curso:", err);
            return res.status(500).json({ erro: "Erro ao atualizar curso" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Curso não encontrado ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Curso atualizado com sucesso." });
    });
});

// Deletar Curso (apenas admin)
app.delete('/cursos/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM curso WHERE id_curso = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar curso:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar este curso pois ele está vinculado a disciplinas ou turmas." });
            }
            return res.status(500).json({ erro: "Erro ao deletar curso" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Curso não encontrado." });
        }
        res.status(200).json({ mensagem: "Curso deletado com sucesso." });
    });
});


// ============================
// SALA (CRUD - PROTEGIDO)
// ============================

// Criar Sala (apenas admin)
app.post('/salas', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { nome_sala, tipo_sala, recursos_sala } = req.body;

    if (!nome_sala) return res.status(400).json({ erro: "O nome da sala é obrigatório." });

    const sql = "INSERT INTO sala (nome_sala, tipo_sala, recursos_sala) VALUES (?, ?, ?)";
    db.query(sql, [nome_sala, tipo_sala, recursos_sala], (err, results) => {
        if (err) {
            console.error("Erro ao cadastrar sala:", err);
            return res.status(500).json({ erro: "Erro ao cadastrar sala" });
        }
        res.status(201).json({ mensagem: "Sala cadastrada com sucesso", id_sala: results.insertId });
    });
});

// Obter todas as salas (todos autenticados)
app.get("/salas", authenticateToken, (req, res) => {
    const sql = "SELECT id_sala, nome_sala, tipo_sala, recursos_sala FROM sala";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar salas:", err);
            return res.status(500).json({ erro: "Erro ao buscar salas" });
        }
        res.status(200).json(results);
    });
});

// Obter uma única sala por ID (todos autenticados)
app.get("/salas/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id_sala, nome_sala, tipo_sala, recursos_sala FROM sala WHERE id_sala = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar sala:", err);
            return res.status(500).json({ erro: "Erro ao buscar sala" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Sala não encontrada." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Sala (apenas admin)
app.put('/salas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { nome_sala, tipo_sala, recursos_sala } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (nome_sala) {
        updateFields.push("nome_sala = ?");
        queryParams.push(nome_sala);
    }
    if (tipo_sala) {
        updateFields.push("tipo_sala = ?");
        queryParams.push(tipo_sala);
    }
    if (recursos_sala) {
        updateFields.push("recursos_sala = ?");
        queryParams.push(recursos_sala);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE sala SET ${updateFields.join(', ')} WHERE id_sala = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar sala:", err);
            return res.status(500).json({ erro: "Erro ao atualizar sala" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Sala não encontrada ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Sala atualizada com sucesso." });
    });
});

// Deletar Sala (apenas admin)
app.delete('/salas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM sala WHERE id_sala = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar sala:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar esta sala pois ela está vinculada a alocações de professor." });
            }
            return res.status(500).json({ erro: "Erro ao deletar sala" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Sala não encontrada." });
        }
        res.status(200).json({ mensagem: "Sala deletada com sucesso." });
    });
});


// ============================
// SOFTWARE (CRUD - PROTEGIDO)
// ============================

// Criar Software (apenas admin)
app.post("/softwares", authenticateToken, authorizeRoles(['admin']), (req, res) => { // Rota padronizada
    const { nome_software, observacao } = req.body;

    if (!nome_software) return res.status(400).json({ erro: "Informe o nome do software" });

    const sql = "INSERT INTO software (nome_software, observacao) VALUES (?, ?)";

    db.query(sql, [nome_software, observacao], (err, results) => {
        if (err) {
            console.error("Erro ao cadastrar software:", err);
            return res.status(500).json({ erro: "Erro ao cadastrar software" });
        }
        res.status(201).json({ mensagem: "Software cadastrado com sucesso", id_software: results.insertId });
    });
});

// Obter todos os softwares (todos autenticados)
app.get("/softwares", authenticateToken, (req, res) => {
    db.query("SELECT id_software, nome_software, observacao FROM software", (err, results) => {
        if (err) {
            console.error("Erro ao buscar softwares:", err);
            return res.status(500).json({ erro: "Erro ao buscar softwares" });
        }
        res.json(results);
    });
});

// Obter um único software por ID (todos autenticados)
app.get("/softwares/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id_software, nome_software, observacao FROM software WHERE id_software = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar software:", err);
            return res.status(500).json({ erro: "Erro ao buscar software" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Software não encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Software (apenas admin)
app.put('/softwares/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { nome_software, observacao } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (nome_software) {
        updateFields.push("nome_software = ?");
        queryParams.push(nome_software);
    }
    if (observacao !== undefined) { // Permite limpar a observação
        updateFields.push("observacao = ?");
        queryParams.push(observacao);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE software SET ${updateFields.join(', ')} WHERE id_software = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar software:", err);
            return res.status(500).json({ erro: "Erro ao atualizar software" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Software não encontrado ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Software atualizado com sucesso." });
    });
});

// Deletar Software (apenas admin)
app.delete('/softwares/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM software WHERE id_software = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar software:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar este software pois ele está vinculado a disciplinas." });
            }
            return res.status(500).json({ erro: "Erro ao deletar software" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Software não encontrado." });
        }
        res.status(200).json({ mensagem: "Software deletado com sucesso." });
    });
});

// ============================
// DISCIPLINA (CRUD - PROTEGIDO)
// ============================

// Criar Disciplina (apenas admin)
app.post("/disciplinas", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { nome_disciplina, ch_pratica, ch_teorica, id_curso_fk } = req.body;

    if (!nome_disciplina || ch_pratica === undefined || ch_teorica === undefined || !id_curso_fk) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios: nome_disciplina, ch_pratica, ch_teorica, id_curso_fk" });
    }

    const sql = `
        INSERT INTO disciplina (nome_disciplina, ch_pratica, ch_teorica, id_curso_fk)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [nome_disciplina, ch_pratica, ch_teorica, id_curso_fk], (err, results) => {
        if (err) {
            console.error("Erro ao cadastrar disciplina:", err);
            return res.status(500).json({ erro: "Erro ao cadastrar disciplina" });
        }
        res.status(201).json({ mensagem: "Disciplina cadastrada com sucesso!", id_disciplina: results.insertId });
    });
});

// Obter todas as disciplinas (todos autenticados)
app.get("/disciplinas", authenticateToken, (req, res) => {
    const sql = `
        SELECT
            d.id_disciplina AS id,
            d.nome_disciplina AS nome,
            d.ch_pratica,
            d.ch_teorica,
            d.carga_horaria,
            d.total_de_encontros,
            c.nome_curso,
            c.id_curso
        FROM disciplina d
        JOIN curso c ON d.id_curso_fk = c.id_curso
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar disciplinas:", err);
            return res.status(500).json({ erro: "Erro ao buscar disciplinas" });
        }
        res.status(200).json(results);
    });
});

// Obter uma única disciplina por ID (todos autenticados)
app.get("/disciplinas/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT
            d.id_disciplina AS id,
            d.nome_disciplina AS nome,
            d.ch_pratica,
            d.ch_teorica,
            d.carga_horaria,
            d.total_de_encontros,
            c.nome_curso,
            c.id_curso
        FROM disciplina d
        JOIN curso c ON d.id_curso_fk = c.id_curso
        WHERE d.id_disciplina = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar disciplina:", err);
            return res.status(500).json({ erro: "Erro ao buscar disciplina" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Disciplina não encontrada." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Disciplina (apenas admin)
app.put('/disciplinas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { nome_disciplina, ch_pratica, ch_teorica, id_curso_fk } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (nome_disciplina) {
        updateFields.push("nome_disciplina = ?");
        queryParams.push(nome_disciplina);
    }
    if (ch_pratica !== undefined) {
        updateFields.push("ch_pratica = ?");
        queryParams.push(ch_pratica);
    }
    if (ch_teorica !== undefined) {
        updateFields.push("ch_teorica = ?");
        queryParams.push(ch_teorica);
    }
    if (id_curso_fk) {
        updateFields.push("id_curso_fk = ?");
        queryParams.push(id_curso_fk);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE disciplina SET ${updateFields.join(', ')} WHERE id_disciplina = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar disciplina:", err);
            return res.status(500).json({ erro: "Erro ao atualizar disciplina" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Disciplina não encontrada ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Disciplina atualizada com sucesso." });
    });
});

// Deletar Disciplina (apenas admin)
app.delete('/disciplinas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM disciplina WHERE id_disciplina = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar disciplina:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar esta disciplina pois ela está vinculada a alocações de professor ou softwares." });
            }
            return res.status(500).json({ erro: "Erro ao deletar disciplina" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Disciplina não encontrada." });
        }
        res.status(200).json({ mensagem: "Disciplina deletada com sucesso." });
    });
});


// ============================
// PROFESSOR (CRUD - PROTEGIDO)
// ============================

// Criar Professor (apenas admin) - Rota padronizada
app.post("/professores", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id_usuario_fk } = req.body; // Alterado para id_usuario_fk para consistência com o DB

    if (!id_usuario_fk) {
        return res.status(400).json({ erro: "O ID do usuário é obrigatório." });
    }

    db.query("SELECT id_usuario, role FROM usuario WHERE id_usuario = ?", [id_usuario_fk], (err, results) => {
        if (err) {
            console.error("Erro ao verificar usuário:", err);
            return res.status(500).json({ erro: "Erro ao verificar usuário no banco de dados." });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }
        if (results[0].role !== 'professor') {
            return res.status(403).json({ erro: "Apenas usuários com o role 'professor' podem ser cadastrados como professores." });
        }

        const sql = `INSERT INTO professor (id_usuario_fk) VALUES (?)`;
        db.query(sql, [id_usuario_fk], (err, result) => {
            if (err) {
                console.error("Erro ao cadastrar professor:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ erro: "Este usuário já está cadastrado como professor." });
                }
                return res.status(500).json({ erro: "Erro ao cadastrar professor no banco de dados." });
            }
            res.status(201).json({ mensagem: "Professor cadastrado com sucesso", id_professor: result.insertId });
        });
    });
});

// Obter todos os professores (todos autenticados)
app.get("/professores", authenticateToken, (req, res) => {
    const sql = `
        SELECT p.id_professor, u.id_usuario, u.nome_completo AS nome_professor, u.email
        FROM professor p
        JOIN usuario u ON p.id_usuario_fk = u.id_usuario
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar professores:", err);
            return res.status(500).json({ erro: "Erro ao buscar professores" });
        }
        res.status(200).json(results);
    });
});

// Obter um único professor por ID (todos autenticados)
app.get("/professores/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT p.id_professor, u.id_usuario, u.nome_completo AS nome_professor, u.email
        FROM professor p
        JOIN usuario u ON p.id_usuario_fk = u.id_usuario
        WHERE p.id_professor = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar professor:", err);
            return res.status(500).json({ erro: "Erro ao buscar professor" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Professor não encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Professor (apenas admin)
app.put('/professores/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { id_usuario_fk } = req.body;

    if (!id_usuario_fk) {
        return res.status(400).json({ erro: "O ID do usuário é obrigatório para atualização." });
    }

    // Verificar se o novo id_usuario_fk existe e tem role 'professor'
    db.query("SELECT id_usuario, role FROM usuario WHERE id_usuario = ?", [id_usuario_fk], (err, userResults) => {
        if (err) {
            console.error("Erro ao verificar novo usuário para professor:", err);
            return res.status(500).json({ erro: "Erro ao verificar usuário no banco de dados." });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ erro: "Novo usuário para professor não encontrado." });
        }
        if (userResults[0].role !== 'professor') {
            return res.status(403).json({ erro: "Apenas usuários com o role 'professor' podem ser vinculados como professores." });
        }

        const sql = `UPDATE professor SET id_usuario_fk = ? WHERE id_professor = ?`;
        db.query(sql, [id_usuario_fk, id], (err, results) => {
            if (err) {
                console.error("Erro ao atualizar professor:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ erro: "Este usuário já está cadastrado como professor." });
                }
                return res.status(500).json({ erro: "Erro ao atualizar professor" });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ erro: "Professor não encontrado ou nenhum dado alterado." });
            }
            res.status(200).json({ mensagem: "Professor atualizado com sucesso." });
        });
    });
});

// Deletar Professor (apenas admin)
app.delete('/professores/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM professor WHERE id_professor = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar professor:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar este professor pois ele está vinculado a alocações." });
            }
            return res.status(500).json({ erro: "Erro ao deletar professor" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Professor não encontrado." });
        }
        res.status(200).json({ mensagem: "Professor deletado com sucesso." });
    });
});

// Obter professores com nomes e alocações (todos autenticados)
app.get("/professores-com-nomes", authenticateToken, (req, res) => {
    const sql = `
        SELECT
            p.id_professor,
            u.nome_completo AS nome_professor,
            GROUP_CONCAT(DISTINCT d.nome_disciplina ORDER BY d.nome_disciplina SEPARATOR ', ') AS disciplinas_alocadas,
            GROUP_CONCAT(DISTINCT CONCAT(t.numero_turma, ' (', c.nome_curso, ')') ORDER BY t.numero_turma SEPARATOR '; ') AS turmas_alocadas
        FROM professor p
        JOIN usuario u ON p.id_usuario_fk = u.id_usuario
        LEFT JOIN professor_alocacao pa ON p.id_professor = pa.id_professor_fk
        LEFT JOIN disciplina d ON pa.id_disciplina_fk = d.id_disciplina
        LEFT JOIN turma t ON pa.id_turma_fk = t.id_turma
        LEFT JOIN curso c ON t.id_curso_fk = c.id_curso
        GROUP BY p.id_professor, u.nome_completo;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar professores com nomes e alocações:", err);
            return res.status(500).json({ erro: "Erro ao buscar professores com nomes e alocações." });
        }
        res.status(200).json(results);
    });
});


// ============================
// RELAÇÃO DISCIPLINA ↔ SOFTWARE (PROTEGIDO)
// ============================

// Vincular Software à Disciplina (apenas admin) - Rota padronizada
app.post("/disciplina-software", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id_disciplina_fk, id_software_fk } = req.body;

    if (!id_disciplina_fk || !id_software_fk) {
        return res.status(400).json({ erro: "Informe disciplina e software" });
    }

    const sql = `
        INSERT INTO disciplina_software (id_disciplina_fk, id_software_fk)
        VALUES (?, ?)
    `;

    db.query(sql, [id_disciplina_fk, id_software_fk], (err, results) => {
        if (err) {
            console.error("Erro ao vincular software:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: "Este software já está vinculado a esta disciplina." });
            }
            return res.status(500).json({ erro: "Erro ao vincular software" });
        }
        res.status(201).json({ mensagem: "Software vinculado à disciplina!" });
    });
});

// Desvincular Software da Disciplina (apenas admin)
app.delete("/disciplina-software/:id_disciplina_fk/:id_software_fk", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id_disciplina_fk, id_software_fk } = req.params;

    const sql = `
        DELETE FROM disciplina_software
        WHERE id_disciplina_fk = ? AND id_software_fk = ?
    `;

    db.query(sql, [id_disciplina_fk, id_software_fk], (err, results) => {
        if (err) {
            console.error("Erro ao desvincular software:", err);
            return res.status(500).json({ erro: "Erro ao desvincular software" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Vínculo entre disciplina e software não encontrado." });
        }
        res.status(200).json({ mensagem: "Software desvinculado da disciplina com sucesso." });
    });
});


// ============================
// PROFESSOR ALOCAÇÃO (CRUD - PROTEGIDO)
// ============================

// Criar Alocação de Professor (apenas admin)
app.post("/professor-alocacoes", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id_professor_fk, id_disciplina_fk, id_turma_fk, id_sala_fk } = req.body;

    if (!id_professor_fk || !id_disciplina_fk || !id_turma_fk) {
        return res.status(400).json({ erro: "Os campos id_professor_fk, id_disciplina_fk e id_turma_fk são obrigatórios." });
    }

    const sql = `
        INSERT INTO professor_alocacao (id_professor_fk, id_disciplina_fk, id_turma_fk, id_sala_fk)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [id_professor_fk, id_disciplina_fk, id_turma_fk, id_sala_fk || null], (err, result) => {
        if (err) {
            console.error("Erro ao criar alocação de professor:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: "Esta alocação (professor, disciplina, turma) já existe." });
            }
            return res.status(500).json({ erro: "Erro ao criar alocação de professor." });
        }
        res.status(201).json({ mensagem: "Alocação de professor criada com sucesso!", id_professor_alocacao: result.insertId });
    });
});

// Obter todas as alocações de professor (todos autenticados)
app.get("/professor-alocacoes", authenticateToken, (req, res) => {
    const sql = `
        SELECT
            pa.id_professor_alocacao,
            pa.id_professor_fk,
            pa.id_disciplina_fk,
            pa.id_turma_fk,
            pa.id_sala_fk,
            u.nome_completo AS nome_professor,
            d.nome_disciplina,
            t.numero_turma,
            t.modulo_ano,
            t.turno,
            s.nome_sala
        FROM professor_alocacao pa
        JOIN professor p ON pa.id_professor_fk = p.id_professor
        JOIN usuario u ON p.id_usuario_fk = u.id_usuario
        JOIN disciplina d ON pa.id_disciplina_fk = d.id_disciplina
        JOIN turma t ON pa.id_turma_fk = t.id_turma
        LEFT JOIN sala s ON pa.id_sala_fk = s.id_sala;
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar alocações de professor:", err);
            return res.status(500).json({ erro: "Erro ao buscar alocações de professor." });
        }
        res.status(200).json(results);
    });
});

// Obter uma única alocação de professor por ID (todos autenticados)
app.get("/professor-alocacoes/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT
            pa.id_professor_alocacao,
            pa.id_professor_fk,
            pa.id_disciplina_fk,
            pa.id_turma_fk,
            pa.id_sala_fk,
            u.nome_completo AS nome_professor,
            d.nome_disciplina,
            t.numero_turma,
            t.modulo_ano,
            t.turno,
            s.nome_sala
        FROM professor_alocacao pa
        JOIN professor p ON pa.id_professor_fk = p.id_professor
        JOIN usuario u ON p.id_usuario_fk = u.id_usuario
        JOIN disciplina d ON pa.id_disciplina_fk = d.id_disciplina
        JOIN turma t ON pa.id_turma_fk = t.id_turma
        LEFT JOIN sala s ON pa.id_sala_fk = s.id_sala
        WHERE pa.id_professor_alocacao = ?;
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar alocação de professor:", err);
            return res.status(500).json({ erro: "Erro ao buscar alocação de professor." });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Alocação de professor não encontrada." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Alocação de Professor (apenas admin)
app.put('/professor-alocacoes/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { id_professor_fk, id_disciplina_fk, id_turma_fk, id_sala_fk } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (id_professor_fk) {
        updateFields.push("id_professor_fk = ?");
        queryParams.push(id_professor_fk);
    }
    if (id_disciplina_fk) {
        updateFields.push("id_disciplina_fk = ?");
        queryParams.push(id_disciplina_fk);
    }
    if (id_turma_fk) {
        updateFields.push("id_turma_fk = ?");
        queryParams.push(id_turma_fk);
    }
    // id_sala_fk pode ser null, então verificamos se foi fornecido
    if (id_sala_fk !== undefined) {
        updateFields.push("id_sala_fk = ?");
        queryParams.push(id_sala_fk || null);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE professor_alocacao SET ${updateFields.join(', ')} WHERE id_professor_alocacao = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar alocação de professor:", err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: "Esta alocação (professor, disciplina, turma) já existe." });
            }
            return res.status(500).json({ erro: "Erro ao atualizar alocação de professor" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Alocação de professor não encontrada ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Alocação de professor atualizada com sucesso." });
    });
});

// Deletar Alocação de Professor (apenas admin)
app.delete('/professor-alocacoes/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM professor_alocacao WHERE id_professor_alocacao = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar alocação de professor:", err);
            return res.status(500).json({ erro: "Erro ao deletar alocação de professor" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Alocação de professor não encontrada." });
        }
        res.status(200).json({ mensagem: "Alocação de professor deletada com sucesso." });
    });
});


// ============================
// TURMA (CRUD - PROTEGIDO)
// ============================

// Criar Turma (apenas admin) - Rota padronizada
app.post("/turmas", authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id_curso_fk, numero_turma, modulo_ano, turno } = req.body; // Alterado para id_curso_fk

    if (!id_curso_fk || !numero_turma || !modulo_ano || !turno) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios (id_curso_fk, numero_turma, modulo_ano, turno)" });
    }

    const turnosValidos = ['matutino','diurno','noturno','integral'];
    if (!turnosValidos.includes(turno)) {
        return res.status(400).json({ erro: `Turno inválido. Valores válidos: ${turnosValidos.join(', ')}` });
    }

    db.query("SELECT id_curso FROM curso WHERE id_curso = ?", [id_curso_fk], (err, rows) => {
        if (err) {
            console.error("Erro ao verificar curso:", err);
            return res.status(500).json({ erro: "Erro ao verificar curso" });
        }
        if (rows.length === 0) {
            return res.status(400).json({ erro: "Curso informado não existe" });
        }

        const sql = `INSERT INTO turma (id_curso_fk, numero_turma, modulo_ano, turno) VALUES (?, ?, ?, ?)`;
        db.query(sql, [id_curso_fk, numero_turma, modulo_ano, turno], (err, result) => {
            if (err) {
                console.error("Erro ao inserir turma:", err);
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({ erro: "Já existe uma turma com esse número, módulo, ano e turno para o curso informado" });
                }
                return res.status(500).json({ erro: "Erro ao cadastrar turma", sqlError: err.sqlMessage });
            }
            res.status(201).json({ mensagem: "Turma criada com sucesso", id_turma: result.insertId });
        });
    });
});

// Obter todas as turmas (todos autenticados)
app.get("/turmas", authenticateToken, (req, res) => {
    const { id_curso_fk } = req.query; // Alterado para id_curso_fk
    let sql = `
        SELECT t.id_turma, t.id_curso_fk, t.numero_turma, t.modulo_ano, t.turno, c.nome_curso
        FROM turma t
        LEFT JOIN curso c ON c.id_curso = t.id_curso_fk
    `;
    const params = [];
    if (id_curso_fk) {
        sql += " WHERE t.id_curso_fk = ?";
        params.push(id_curso_fk);
    }
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Erro ao listar turmas:", err);
            return res.status(500).json({ erro: "Erro ao listar turmas" });
        }
        res.json(results);
    });
});

// Obter uma única turma por ID (todos autenticados)
app.get("/turmas/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT t.id_turma, t.id_curso_fk, t.numero_turma, t.modulo_ano, t.turno, c.nome_curso
        FROM turma t
        LEFT JOIN curso c ON c.id_curso = t.id_curso_fk
        WHERE t.id_turma = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar turma:", err);
            return res.status(500).json({ erro: "Erro ao buscar turma" });
        }
        if (results.length === 0) {
            return res.status(404).json({ erro: "Turma não encontrada." });
        }
        res.status(200).json(results[0]);
    });
});

// Atualizar Turma (apenas admin)
app.put('/turmas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const { id_curso_fk, numero_turma, modulo_ano, turno } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (id_curso_fk) {
        updateFields.push("id_curso_fk = ?");
        queryParams.push(id_curso_fk);
    }
    if (numero_turma) {
        updateFields.push("numero_turma = ?");
        queryParams.push(numero_turma);
    }
    if (modulo_ano) {
        updateFields.push("modulo_ano = ?");
        queryParams.push(modulo_ano);
    }
    if (turno) {
        const turnosValidos = ['matutino','diurno','noturno','integral'];
        if (!turnosValidos.includes(turno)) {
            return res.status(400).json({ erro: `Turno inválido. Valores válidos: ${turnosValidos.join(', ')}` });
        }
        updateFields.push("turno = ?");
        queryParams.push(turno);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ erro: "Nenhum campo para atualizar fornecido." });
    }

    const sql = `UPDATE turma SET ${updateFields.join(', ')} WHERE id_turma = ?`;
    queryParams.push(id);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Erro ao atualizar turma:", err);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ erro: "Já existe uma turma com esses dados para o curso informado." });
            }
            return res.status(500).json({ erro: "Erro ao atualizar turma" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Turma não encontrada ou nenhum dado alterado." });
        }
        res.status(200).json({ mensagem: "Turma atualizada com sucesso." });
    });
});

// Deletar Turma (apenas admin)
app.delete('/turmas/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM turma WHERE id_turma = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao deletar turma:", err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ erro: "Não é possível deletar esta turma pois ela está vinculada a alocações de professor." });
            }
            return res.status(500).json({ erro: "Erro ao deletar turma" });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ erro: "Turma não encontrada." });
        }
        res.status(200).json({ mensagem: "Turma deletada com sucesso." });
    });
});


// ============================
// RELATÓRIO FINAL PARA O FRONT (PROTEGIDO)
// ============================
app.get("/grade-curricular", authenticateToken, (req, res) => {
    const sql = `SELECT * FROM vw_grade_curricular_completa`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao gerar relatório da grade curricular:", err);
            // Log the full error object for detailed debugging
            console.error("Detalhes do erro SQL:", err);
            return res.status(500).json({ erro: "Erro ao gerar relatório da grade curricular", detalhes: err.message });
        }
        res.json(results);
    });
});

// ============================
// SERVER
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

