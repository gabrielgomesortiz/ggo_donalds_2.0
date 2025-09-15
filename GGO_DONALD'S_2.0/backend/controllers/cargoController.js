const db = require('../database'); // módulo de conexão PostgreSQL

// Listar todos os cargos
const getAllCargos = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cargo ORDER BY id_cargo');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar cargos' });
    }
};

// Buscar cargo por ID
const getCargoById = async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar cargo' });
    }
};

// Criar cargo
const createCargo = async (req, res) => {
    const { nome_cargo } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO cargo (nome_cargo) VALUES ($1) RETURNING *',
            [nome_cargo]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar cargo' });
    }
};

// Atualizar cargo
const updateCargo = async (req, res) => {
    const id = req.params.id;
    const { nome_cargo } = req.body;
    try {
        const result = await db.query(
            'UPDATE cargo SET nome_cargo=$1 WHERE id_cargo=$2 RETURNING *',
            [nome_cargo, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar cargo' });
    }
};

// Excluir cargo
const deleteCargo = async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM cargo WHERE id_cargo = $1', [id]);
        res.json({ message: 'Cargo excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir cargo' });
    }
};

module.exports = {
    getAllCargos,
    getCargoById,
    createCargo,
    updateCargo,
    deleteCargo
};
