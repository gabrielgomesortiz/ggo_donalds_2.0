const db = require('../database.js');
const path = require('path');
const fs = require('fs');

exports.listarProdutos = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT p.*, c.nome_categoria FROM Produto p JOIN Categoria c ON p.id_categoria = c.id_categoria ORDER BY p.id_produto'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar produtos:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.criarProduto = async (req, res) => {
    try {
        const { nome, id_categoria, quantidade_estoque, data_fabricacao, preco } = req.body;

        // 1. Cria o produto sem imagem
        const result = await db.query(
            'INSERT INTO Produto (nome, id_categoria, quantidade_estoque, data_fabricacao, preco) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [nome, id_categoria, quantidade_estoque, data_fabricacao, preco]
        );
        const produto = result.rows[0];

        let caminho_imagem = null;

        // 2. Se veio imagem, salva com o nome do id do produto
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpeg';
            const novoNome = `${produto.id_produto}${ext}`;
            const pastaImgs = path.join(__dirname, '../../frontend/imgs');
            const novoCaminho = path.join(pastaImgs, novoNome);

            // 3. Renomeia/move o arquivo temporário para o nome correto
            fs.renameSync(req.file.path, novoCaminho);

            caminho_imagem = `imgs/${novoNome}`;

            // 4. Atualiza o produto com o caminho da imagem
            await db.query(
                'UPDATE Produto SET caminho_imagem = $1 WHERE id_produto = $2',
                [caminho_imagem, produto.id_produto]
            );
            produto.caminho_imagem = caminho_imagem;
        }

        res.status(201).json(produto);
    } catch (err) {
        console.error('Erro ao criar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.atualizarProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Busca produto existente
        const produtoExistente = await db.query('SELECT * FROM Produto WHERE id_produto=$1', [id]);
        if (produtoExistente.rows.length === 0) return res.status(404).json({ error: "Produto não encontrado" });

        const nome = req.body.nome ?? produtoExistente.rows[0].nome;
        const preco = req.body.preco ? parseFloat(req.body.preco) : produtoExistente.rows[0].preco;
        const quantidade_estoque = req.body.quantidade_estoque ? parseInt(req.body.quantidade_estoque) : produtoExistente.rows[0].quantidade_estoque;
        const data_fabricacao = req.body.data_fabricacao || produtoExistente.rows[0].data_fabricacao;
        const id_categoria = req.body.id_categoria ? parseInt(req.body.id_categoria) : produtoExistente.rows[0].id_categoria;

        let caminho_imagem = produtoExistente.rows[0].caminho_imagem;

        // Se veio imagem, salva com o nome do id do produto
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpeg';
            const novoNome = `${id}${ext}`;
            const pastaImgs = path.join(__dirname, '../../frontend/imgs');
            const novoCaminho = path.join(pastaImgs, novoNome);

            // Remove imagem antiga se existir e for diferente
            if (caminho_imagem) {
                const antigoCaminho = path.join(pastaImgs, path.basename(caminho_imagem));
                if (fs.existsSync(antigoCaminho) && antigoCaminho !== novoCaminho) {
                    fs.unlinkSync(antigoCaminho);
                }
            }

            // Renomeia/move o arquivo temporário para o nome correto
            fs.renameSync(req.file.path, novoCaminho);

            caminho_imagem = `imgs/${novoNome}`;
        }

        const result = await db.query(
            `UPDATE Produto
             SET nome=$1, preco=$2, quantidade_estoque=$3, data_fabricacao=$4, id_categoria=$5, caminho_imagem=$6
             WHERE id_produto=$7
             RETURNING *`,
            [nome, preco, quantidade_estoque, data_fabricacao, id_categoria, caminho_imagem, id]
        );

        res.json({ message: "Produto atualizado com sucesso!", produto: result.rows[0] });

    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: "Erro ao atualizar produto" });
    }
};

exports.obterProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await db.query('SELECT * FROM Produto WHERE id_produto = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.deletarProduto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Remove imagem do disco se existir
        const produto = await db.query('SELECT * FROM Produto WHERE id_produto=$1', [id]);
        if (produto.rows.length > 0 && produto.rows[0].caminho_imagem) {
            const pastaImgs = path.join(__dirname, '../../frontend/imgs');
            const imgPath = path.join(pastaImgs, path.basename(produto.rows[0].caminho_imagem));
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        }

        await db.query('DELETE FROM Produto WHERE id_produto=$1', [id]);
        res.json({ status: 'Produto deletado' });
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.uploadImagem = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma imagem enviada' });
        }

        const produtoId = req.body.produtoId;
        if (!produtoId) {
            return res.status(400).json({ error: 'Produto ID não fornecido' });
        }

        // Caminho relativo para salvar no banco
        const caminhoImagem = `img/${req.file.filename}`;

        // Atualiza o caminho da imagem no banco
        const result = await db.query(
            'UPDATE Produto SET caminho_imagem = $1 WHERE id_produto = $2 RETURNING *',
            [caminhoImagem, produtoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({ message: 'Imagem enviada com sucesso!', produto: result.rows[0], caminho_imagem: caminhoImagem });
    } catch (err) {
        console.error('Erro no upload de imagem:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};