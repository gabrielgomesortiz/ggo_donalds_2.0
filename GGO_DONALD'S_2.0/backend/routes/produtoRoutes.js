const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Caminho correto para salvar as imagens
const caminhoImg = path.join(__dirname, '../../frontend/imgs');

// Cria a pasta se não existir
if (!fs.existsSync(caminhoImg)) {
    fs.mkdirSync(caminhoImg, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, caminhoImg);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Gera nome seguro com timestamp
        const safeName = `${Date.now()}${ext}`;
        cb(null, safeName);
    }
});

const upload = multer({ storage });

// Rotas CRUD Produto
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.obterProduto);
router.post('/', upload.single('imagem'), produtoController.criarProduto);
router.put('/:id', upload.single('imagem'), produtoController.atualizarProduto);
router.delete('/:id', produtoController.deletarProduto);
router.post('/upload', upload.single('imagem'), produtoController.uploadImagem);

module.exports = router;
