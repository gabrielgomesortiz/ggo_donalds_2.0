const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

router.get('/', pagamentoController.listarPagamentos);
router.post('/', pagamentoController.criarPagamento);

module.exports = router;
