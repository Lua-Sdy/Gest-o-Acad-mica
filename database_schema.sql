-- ===========================
-- CRIAÇÃO DO BANCO DE DADOS
-- ===========================
CREATE DATABASE IF NOT EXISTS sistema;
USE sistema;

-- ===========================
-- TABELA DE USUÁRIO
-- ===========================
CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    -- Novo campo 'role' para definir o papel do usuário
    role ENUM('admin', 'professor', 'coordinator') DEFAULT 'professor'
);

-- ===========================
-- TABELA DE PROFESSOR (linka ao usuário)
-- ===========================
CREATE TABLE professor (
    id_professor INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario_fk INT UNIQUE NOT NULL, -- Cada usuário pode ser professor uma vez
    FOREIGN KEY (id_usuario_fk) REFERENCES usuario(id_usuario)
);

-- ===========================
-- TABELA DE SOFTWARE
-- ===========================
CREATE TABLE software (
    id_software INT PRIMARY KEY AUTO_INCREMENT,
    nome_software VARCHAR(120) NOT NULL,
    observacao TEXT
);

-- ===========================
-- TABELA DE SALA
-- ===========================
CREATE TABLE sala (
    id_sala INT PRIMARY KEY AUTO_INCREMENT,
    nome_sala VARCHAR(255) NOT NULL,
    tipo_sala VARCHAR(50),
    recursos_sala VARCHAR(255)
);

-- ===========================
-- TABELA CURSO
-- ===========================
CREATE TABLE curso (
    id_curso INT PRIMARY KEY AUTO_INCREMENT,
    nome_curso VARCHAR(120) NOT NULL,
    carga_horaria INT,
    area TEXT,
    descricao TEXT
);

-- ===========================
-- TABELA TURMA
-- ===========================
CREATE TABLE turma (
    id_turma INT PRIMARY KEY AUTO_INCREMENT,
    id_curso_fk INT NOT NULL,
    numero_turma VARCHAR(50) NOT NULL, -- Alterado para VARCHAR para flexibilidade (ex: "A", "B")
    modulo_ano VARCHAR(50),
    turno ENUM('matutino','diurno','noturno','integral') NOT NULL,
    FOREIGN KEY (id_curso_fk) REFERENCES curso(id_curso),
    UNIQUE(id_curso_fk, numero_turma, modulo_ano, turno) -- Chave única mais específica
);

-- ===========================
-- TABELA DISCIPLINA
-- ===========================
CREATE TABLE disciplina (
    id_disciplina INT PRIMARY KEY AUTO_INCREMENT,
    nome_disciplina VARCHAR(120) NOT NULL,
    ch_pratica DECIMAL(5,2),
    ch_teorica DECIMAL(5,2),
    total_de_encontros INT GENERATED ALWAYS AS (CEIL((ch_pratica + ch_teorica) * 60 / 50)) STORED,
    carga_horaria DECIMAL(5,2) GENERATED ALWAYS AS (ch_pratica + ch_teorica) STORED,
    id_curso_fk INT NOT NULL, -- Disciplina deve pertencer a um curso
    FOREIGN KEY (id_curso_fk) REFERENCES curso(id_curso)
);

-- ===========================
-- TABELA DE ALOCAÇÃO DE PROFESSOR (NOVA - para flexibilidade)
-- = ===========================
CREATE TABLE professor_alocacao (
    id_professor_alocacao INT PRIMARY KEY AUTO_INCREMENT,
    id_professor_fk INT NOT NULL,
    id_disciplina_fk INT NOT NULL,
    id_turma_fk INT NOT NULL,
    id_sala_fk INT, -- Opcional: sala específica para esta alocação
    FOREIGN KEY (id_professor_fk) REFERENCES professor(id_professor),
    FOREIGN KEY (id_disciplina_fk) REFERENCES disciplina(id_disciplina),
    FOREIGN KEY (id_turma_fk) REFERENCES turma(id_turma),
    FOREIGN KEY (id_sala_fk) REFERENCES sala(id_sala),
    UNIQUE (id_professor_fk, id_disciplina_fk, id_turma_fk) -- Um professor ensina uma disciplina específica em uma turma específica uma vez
);

-- ===========================
-- TABELA N:N DISCIPLINA ↔ SOFTWARE
-- ===========================
CREATE TABLE disciplina_software (
    id_disciplina_fk INT,
    id_software_fk INT,
    PRIMARY KEY (id_disciplina_fk, id_software_fk),
    FOREIGN KEY (id_disciplina_fk) REFERENCES disciplina(id_disciplina),
    FOREIGN KEY (id_software_fk) REFERENCES software(id_software)
);

-- ===========================
-- TABELA DE AUDITORIA
-- ===========================
CREATE TABLE auditoria (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabela_afetada VARCHAR(255) NOT NULL,
    acao ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    usuario_nome VARCHAR(255) NULL,
    usuario_login VARCHAR(255) NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    dados_antes TEXT,
    dados_depois TEXT
);

-- ===========================
-- VIEW REVISADA PARA GRADE CURRICULAR
-- ===========================
CREATE OR REPLACE VIEW vw_grade_curricular_completa AS
SELECT
    pa.id_professor_alocacao, -- ID único para a alocação
    u.nome_completo AS nome_professor,
    c.nome_curso,
    t.numero_turma,
    t.modulo_ano,
    t.turno,
    d.nome_disciplina,
    d.carga_horaria AS ch_total,
    d.ch_pratica,
    d.ch_teorica,
    d.total_de_encontros,
    s.nome_sala AS laboratorio_sala,
    s.recursos_sala AS recursos_lab,
    GROUP_CONCAT(so.nome_software ORDER BY so.nome_software SEPARATOR ', ') AS softwares_usados
FROM professor_alocacao pa
JOIN professor p ON pa.id_professor_fk = p.id_professor
JOIN usuario u ON p.id_usuario_fk = u.id_usuario
JOIN disciplina d ON pa.id_disciplina_fk = d.id_disciplina
JOIN curso c ON d.id_curso_fk = c.id_curso
JOIN turma t ON pa.id_turma_fk = t.id_turma
LEFT JOIN sala s ON pa.id_sala_fk = s.id_sala
LEFT JOIN disciplina_software ds ON d.id_disciplina = ds.id_disciplina_fk
LEFT JOIN software so ON ds.id_software_fk = so.id_software
GROUP BY
    pa.id_professor_alocacao, u.nome_completo, c.nome_curso, t.numero_turma, t.modulo_ano, t.turno,
    d.nome_disciplina, d.carga_horaria, d.ch_pratica, d.ch_teorica, d.total_de_encontros,
    s.nome_sala, s.recursos_sala;

-- ===========================
-- TRIGGERS
-- ===========================
DELIMITER $$

CREATE TRIGGER trg_professor_update
AFTER UPDATE ON professor
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (
        tabela_afetada,
        acao,
        usuario_nome,
        usuario_login,
        dados_antes,
        dados_depois
    ) VALUES (
        'professor',
        'UPDATE',
        @usuario_nome, @usuario_login,
        CONCAT('Antes: ', 
            'id=', OLD.id_professor, ', id_usuario_fk=', OLD.id_usuario_fk
        ),
        CONCAT('Depois: ',
            'id=', NEW.id_professor, ', id_usuario_fk=', NEW.id_usuario_fk
        )
    );
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER trg_professor_insert
AFTER INSERT ON professor
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (
        tabela_afetada,
        acao,
        usuario_nome,
        usuario_login,
        dados_antes,
        dados_depois
    ) VALUES (
        'professor',
        'INSERT',
        @usuario_nome, @usuario_login,
        NULL,
        CONCAT('Novo registro: id=', NEW.id_professor, ', id_usuario_fk=', NEW.id_usuario_fk)
    );
END$$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER trg_professor_delete
AFTER DELETE ON professor
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (
        tabela_afetada,
        acao,
        usuario_nome,
        usuario_login,
        dados_antes,
        dados_depois
    ) VALUES (
        'professor',
        'DELETE',
        @usuario_nome, @usuario_login,
        CONCAT('Registro removido: id=', OLD.id_professor, ', id_usuario_fk=', OLD.id_usuario_fk),
        NULL
    );
END$$

DELIMITER ;

ALTER TABLE auditoria 
MODIFY usuario_nome VARCHAR(255) NULL,
MODIFY usuario_login VARCHAR(255) NULL;
