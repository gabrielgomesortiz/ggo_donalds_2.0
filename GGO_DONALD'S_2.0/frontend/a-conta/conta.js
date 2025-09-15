// conta.js
const PEDIDO_KEY = 'pedidoAtual';

document.addEventListener('DOMContentLoaded', function () {
    // ==============================
    // Checar usuário no cookie
    // ==============================
    const usuarioStr = getCookie("usuario");
    if (!usuarioStr) {
        alert("Faça login antes de continuar.");
        window.location.href = "../a-login/login.html";
        return;
    } else {
        console.log("Usuário na conta:", usuarioStr);
    }

    // ==============================
    // Carregar pedido
    // ==============================
    const pedidoJSON = localStorage.getItem(PEDIDO_KEY);

    if (!pedidoJSON) {
        mostrarMensagemErro('Nenhum pedido encontrado.');
        return;
    }

    try {
        const pedido = JSON.parse(pedidoJSON);
        exibirPedido(pedido);
    } catch (error) {
        console.error('Erro ao processar pedido:', error);
        mostrarMensagemErro('Erro ao carregar o pedido.');
    }

    configurarBotoes();
});

// ==============================
// Funções de exibição
// ==============================
function exibirPedido(pedido) {
    const container = document.querySelector('.conta');
    container.innerHTML = '';

    ['hamburgueres', 'acompanhamentos', 'bebidas'].forEach(categoria => {
        const itensValidos = pedido.pedidos[categoria]?.filter(i => i.quantidade > 0);
        if (itensValidos && itensValidos.length > 0) {
            const tituloCategoria = document.createElement('h2');
            tituloCategoria.className = 'categoria-titulo';
            tituloCategoria.textContent = formatarTituloCategoria(categoria);
            container.appendChild(tituloCategoria);

            adicionarItens(container, itensValidos);
        }
    });

    if (pedido.totalGeral > 0) {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'conta-total';
        totalDiv.innerHTML = `
            <p>Total a pagar: <span>R$ ${pedido.totalGeral.toFixed(2)}</span></p>
            <p>Itens: ${pedido.itensTotais}</p>
            <p>Data: ${pedido.data}</p>
        `;
        container.appendChild(totalDiv);
    }
}

function adicionarItens(container, itens) {
    itens.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'conta-item';
        itemDiv.innerHTML = `
            <p class="coluna_nome">${item.nome}</p>
            <p class="coluna_quantidade">${item.quantidade}x</p>
            <p class="coluna_preco">R$ ${item.precoTotal.toFixed(2)}</p>
        `;
        container.appendChild(itemDiv);
    });
}

function formatarTituloCategoria(categoria) {
    const titulos = {
        'hamburgueres': 'Hambúrgueres:',
        'acompanhamentos': 'Acompanhamentos:',
        'bebidas': 'Bebidas:'
    };
    return titulos[categoria] || categoria;
}

function mostrarMensagemErro(mensagem) {
    document.querySelector('.conta').innerHTML = `
        <p class="mensagem-erro">${mensagem}</p>
        <button onclick="window.location.href='../index.html'">Voltar ao cardápio</button>
    `;
}

// ==============================
// Botões
// ==============================
function configurarBotoes() {
    const botoes = document.querySelectorAll('.buttons_volta_prosseguir');
    if (botoes.length < 2) return;

    botoes[0].addEventListener('click', voltarParaCardapio);
    // O botão “prosseguir” redireciona para pagamento
    botoes[1].addEventListener('click', () => {
        window.location.href = '../a-pagamento/pagamento.html';
    });
}

function voltarParaCardapio() {
    window.location.href = '../index.html';
}

// ==============================
// Cookie helper
// ==============================
function getCookie(nome) {
    const cookies = document.cookie.split(';').map(c => c.trim());
    for (const cookie of cookies) {
        if (cookie.startsWith(nome + '=')) {
            return decodeURIComponent(cookie.substring(nome.length + 1));
        }
    }
    return null;
}
