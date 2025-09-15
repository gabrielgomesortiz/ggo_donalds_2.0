const db = require('../database.js');

// Listar todas as pessoas
exports.listarPessoas = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Pessoa ORDER BY id_pessoa');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar pessoas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Criar uma nova pessoa
exports.criarPessoa = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Formato de email inválido' });
        }

        const result = await db.query(
            'INSERT INTO pessoa (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
            [nome, email, senha]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar pessoa:', err);

        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email já está em uso' });
        }

        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Obter pessoa por ID
exports.obterPessoa = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const result = await db.query('SELECT * FROM Pessoa WHERE id_pessoa=$1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter pessoa:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar pessoa
exports.atualizarPessoa = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, senha } = req.body;

        const result = await db.query(
            'UPDATE Pessoa SET nome=$1, email=$2, senha=$3 WHERE id_pessoa=$4 RETURNING *',
            [nome, email, senha, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar pessoa:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Deletar pessoa
exports.deletarPessoa = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.query('DELETE FROM Pessoa WHERE id_pessoa=$1', [id]);
        res.json({ status: 'Pessoa deletada' });
    } catch (err) {
        console.error('Erro ao deletar pessoa:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar apenas a senha
exports.atualizarSenha = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { senha_atual, nova_senha } = req.body;

        const pessoaResult = await db.query('SELECT * FROM Pessoa WHERE id_pessoa=$1', [id]);
        if (pessoaResult.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

        const pessoa = pessoaResult.rows[0];
        if (pessoa.senha !== senha_atual) return res.status(400).json({ error: 'Senha atual incorreta' });

        const updateResult = await db.query(
            'UPDATE Pessoa SET senha=$1 WHERE id_pessoa=$2 RETURNING *',
            [nova_senha, id]
        );

        res.json(updateResult.rows[0]);
    } catch (err) {
        console.error('Erro ao atualizar senha:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
