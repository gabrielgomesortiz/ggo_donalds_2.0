const db = require('../database');

// Listar pagamentos
exports.listarPagamentos = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Pagamento');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.criarPagamento = async (req, res) => {
    try {
        const { id_pessoa, id_forma_pagamento, status_pagamento } = req.body;

        // 1️⃣ Criar pagamento
        const result = await db.query(
            'INSERT INTO Pagamento (id_forma_pagamento, status_pagamento) VALUES ($1, $2) RETURNING *',
            [id_forma_pagamento, status_pagamento]
        );

        const pagamento = result.rows[0];

        // 2️⃣ Criar pedido vinculado à pessoa e ao pagamento
        await db.query(
            'INSERT INTO Pedido (id_pessoa, id_pagamento, data_pedido) VALUES ($1, $2, NOW())',
            [id_pessoa, pagamento.id_pagamento]
        );

        // 3️⃣ Retornar pagamento criado
        res.status(201).json(pagamento);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
