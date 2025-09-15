const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const db = require('./database'); // Banco PostgreSQL

const app = express();

// Configurações do servidor
const HOST = 'localhost';
const PORT_FIXA = 3001;

// Caminho para frontend
const caminhoFrontend = path.join(__dirname, '../../frontend/imgs');
console.log('Caminho frontend:', caminhoFrontend);
app.use('/imgs', express.static(path.join(__dirname, '../frontend/imgs')));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(caminhoFrontend));

// CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Adiciona banco de dados ao req
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Importando rotas
const loginRoutes = require('./routes/loginRoutes');
const pessoaRoutes = require('./routes/pessoaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');      // ✅ nova

// Usando rotas
app.use('/login', loginRoutes);
app.use('/pessoa', pessoaRoutes);
app.use('/produto', produtoRoutes);
app.use('/funcionario', funcionarioRoutes);
app.use('/categoria', categoriaRoutes);
app.use('/cargo', cargoRoutes);
app.use('/pagamento', pagamentoRoutes);      // ✅ nova


// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'O server está funcionando - essa é a rota raiz!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      res.status(200).json({ status: 'OK', message: 'Servidor e banco funcionando', timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ status: 'ERROR', message: 'Problema na conexão com o banco', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({ status: 'ERROR', message: error.message, timestamp: new Date().toISOString() });
  }
});

// Erros globais
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// Rotas 404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});



// Inicializar servidor
const startServer = async () => {
  try {
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();
    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ PostgreSQL conectado com sucesso');
    const PORT = process.env.PORT || PORT_FIXA;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Encerramento gracioso
const gracefulShutdown = async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start
startServer();
