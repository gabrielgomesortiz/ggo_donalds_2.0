// backend/controllers/categoriaController.js
const db = require('../database');

// Listar todas as categorias
const getAllCategorias = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categoria ORDER BY id_categoria');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
};

// Buscar categoria por ID
const getCategoriaById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query('SELECT * FROM categoria WHERE id_categoria = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
};

// Criar categoria
const createCategoria = async (req, res) => {
  const { nome_categoria } = req.body; // <--- CORRIGIDO
  try {
    const result = await db.query(
      'INSERT INTO categoria (nome_categoria) VALUES ($1) RETURNING *', // <--- CORRIGIDO
      [nome_categoria]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

// Atualizar categoria
const updateCategoria = async (req, res) => {
  const id = req.params.id;
  const { nome_categoria } = req.body; // <--- CORRIGIDO
  try {
    const result = await db.query(
      'UPDATE categoria SET nome_categoria=$1 WHERE id_categoria=$2 RETURNING *', // <--- CORRIGIDO
      [nome_categoria, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Categoria não encontrada' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
};

// Excluir categoria
const deleteCategoria = async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM categoria WHERE id_categoria = $1', [id]);
    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir categoria' });
  }
};

module.exports = {
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria
};
