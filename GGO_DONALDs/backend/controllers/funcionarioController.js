// backend/controllers/funcionarioController.js
const db = require('../database'); // seu módulo de conexão com PostgreSQL

// Listar todos os funcionários
const getAllFuncionarios = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM funcionario ORDER BY id_funcionario');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar funcionários' });
  }
};

// Buscar funcionário por ID
const getFuncionarioById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM funcionario WHERE id_funcionario = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar funcionário' });
  }
};

// Criar funcionário
const createFuncionario = async (req, res) => {
  const { data_inicio, salario, id_cargo } = req.body; // <-- trocar cargo por id_cargo
  try {
    const result = await db.query(
      'INSERT INTO funcionario (data_inicio, salario, id_cargo) VALUES ($1, $2, $3) RETURNING *',
      [data_inicio, salario, id_cargo] // <-- usar id_cargo aqui
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
};

// Atualizar funcionário
const updateFuncionario = async (req, res) => {
  const id = req.params.id;
  const { data_inicio, salario, id_cargo } = req.body; // <-- trocar cargo por id_cargo
  try {
    const result = await db.query(
      'UPDATE funcionario SET data_inicio=$1, salario=$2, id_cargo=$3 WHERE id_funcionario=$4 RETURNING *',
      [data_inicio, salario, id_cargo, id] // <-- usar id_cargo aqui
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
};

// Excluir funcionário
const deleteFuncionario = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM funcionario WHERE id_funcionario = $1', [id]);
    res.json({ message: 'Funcionário excluído com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir funcionário' });
  }
};

module.exports = {
  getAllFuncionarios,
  getFuncionarioById,
  createFuncionario,
  updateFuncionario,
  deleteFuncionario
};
