const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

// Rotas de autenticação
router.post('/verificarEmail', loginController.verificarEmail);
router.post('/verificarSenha', loginController.verificarSenha);
router.post('/verificaSeUsuarioEstaLogado', loginController.verificaSeUsuarioEstaLogado);

// Rotas relacionadas a Pessoa (login pode listar/criar usuário)
router.get('/', loginController.listarPessoas);
router.post('/', loginController.verificarSenha);
router.get('/:id', loginController.obterPessoa);

// Exemplo de rota login no backend (Node.js + Express + algum ORM)
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  // 1. Busca na tabela Pessoa
  const pessoa = await db.Pessoa.findOne({ where: { email, senha } });
  if (!pessoa) return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

  // 2. Verifica se é funcionário
  const funcionario = await db.Funcionario.findOne({ where: { id_pessoa: pessoa.id } });
  if (funcionario) {
    // 3. Busca o cargo
    const cargo = await db.Cargo.findOne({ where: { id: funcionario.id_cargo } });
    if (cargo && cargo.nome_cargo === 'adm') {
      return res.json({ nome: pessoa.nome, email: pessoa.email, tipo: 'adm' });
    } else {
      return res.json({ nome: pessoa.nome, email: pessoa.email, tipo: 'funcionario' });
    }
  }

  // 4. Se não for funcionário, é cliente
  return res.json({ nome: pessoa.nome, email: pessoa.email, tipo: 'cliente' });
});

// router.put('/:id', loginController.atualizarPessoa);
// router.delete('/:id', loginController.deletarPessoa);

module.exports = router;
