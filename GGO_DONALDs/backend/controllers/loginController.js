const db = require('../database.js');

// Verifica se o usuário está logado
exports.verificaSeUsuarioEstaLogado = (req, res) => {
  console.log('loginController - Acessando rota /verificaSeUsuarioEstaLogado');
  const nome = req.cookies.usuarioLogado;
  if (nome) {
    res.json({ status: 'ok', nome });
  } else {
    res.json({ status: 'nao_logado' });
  }
};

// Listar todas as pessoas (clientes e funcionários)
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM Pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Verifica se email existe
exports.verificarEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: 'erro', mensagem: 'Email obrigatório' });
  }

  try {
    const result = await db.query('SELECT nome FROM Pessoa WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nome });
    }
    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};
// Verifica senha e identifica se é funcionário ou admin
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.json({ status: 'erro', mensagem: 'Email e senha obrigatórios' });
  }

  try {
    // 1. Consulta a pessoa pelo email
    const resultPessoa = await db.query(
      'SELECT id_pessoa, nome, email, senha FROM Pessoa WHERE email = $1',
      [email]
    );

    if (resultPessoa.rows.length === 0) {
      return res.json({ status: 'erro', mensagem: 'Email ou senha incorretos' });
    }

    const usuario = resultPessoa.rows[0];

    // 2. Verifica a senha
    if (usuario.senha !== senha) {
      return res.json({ status: 'erro', mensagem: 'Email ou senha incorretos' });
    }

    // 3. Verifica se é funcionário/admin
    let tipo = 'cliente';
    let cargo = null;

    const resultFuncionario = await db.query(
      'SELECT f.id_cargo, c.nome_cargo FROM Funcionario f JOIN Cargo c ON f.id_cargo = c.id_cargo WHERE f.id_pessoa = $1',
      [usuario.id_pessoa]
    );

    if (resultFuncionario.rows.length > 0) {
      cargo = resultFuncionario.rows[0].nome_cargo.toLowerCase();
      if (cargo === 'adm' || cargo === 'chefe') tipo = 'adm';
      else tipo = 'funcionario';
    }

    // 4. Retorna todos os dados necessários para o cookie
    const usuarioCookie = {
      id_pessoa: usuario.id_pessoa,
      nome: usuario.nome,
      email: usuario.email,
      tipo,
      cargo
    };

    // 5. Define cookie seguro
    res.cookie('usuarioLogado', usuario.nome, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    });

    // 6. Retorna para o frontend o objeto completo
    res.json({ status: 'ok', ...usuarioCookie });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });
  res.json({ status: 'deslogado' });
};

// Criar pessoa
exports.criarPessoa = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const result = await db.query(
      'INSERT INTO Pessoa (nome, email, senha) VALUES ($1, $2, $3) RETURNING *',
      [nome, email, senha]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar pessoa:', err);
    if (err.code === '23505') { // email já cadastrado
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

    const result = await db.query('SELECT * FROM Pessoa WHERE id_pessoa = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao obter pessoa:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
