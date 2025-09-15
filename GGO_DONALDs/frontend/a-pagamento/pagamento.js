// pagamento.js
const PIX_CODE = '00020126360014BR.GOV.BCB.PIX0114+5561999999995204000053039865405100.005802BR5913NOME DO RECEBEDOR6009CIDADE62070503***6304ABCD';
const API_URL = 'http://localhost:3001';
const PEDIDO_KEY = 'pedidoAtual';
let qrcode;

document.addEventListener('DOMContentLoaded', () => {
    // ==============================
    // Checar usuário no cookie
    // ==============================
    const usuarioStr = getCookie("usuario");
    if (!usuarioStr) {
        alert("Faça login antes de pagar.");
        window.location.href = "../a-login/login.html";
        return;
    }

    const usuario = JSON.parse(usuarioStr);
    console.log("Usuário no pagamento:", usuario);

    const id_pessoa = usuario.id_pessoa;
    if (!id_pessoa) {
        alert("ID do usuário não encontrado!");
        throw new Error("Usuário inválido");
    }

    // ==============================
    // Inicializar tela
    // ==============================
    gerarQrCode();

    document.getElementById('pix')?.addEventListener('change', () => gerarQrCode());
    document.getElementById('btn_copiar_pix')?.addEventListener('click', async () => await pagar('pix', id_pessoa));
    document.getElementById('btn_pagar')?.addEventListener('click', async () => await pagar('cartao', id_pessoa));
});

function gerarQrCode() {
    const qrcodeElement = document.getElementById('qrcode');
    if (!qrcodeElement) return;

    qrcodeElement.innerHTML = '';
    qrcode = new QRCode(qrcodeElement, {
        text: PIX_CODE,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    const pixText = document.getElementById('pix_code_text');
    if (pixText) pixText.textContent = PIX_CODE;
}

async function registrarPedido(idCliente, idFormaPagamento) {
    const pedidoAtual = JSON.parse(localStorage.getItem(PEDIDO_KEY));
    if (!pedidoAtual || !pedidoAtual.pedidos) throw new Error("Nenhum pedido encontrado.");

    const itens = [];
    const categorias = ['hamburgueres', 'acompanhamentos', 'bebidas'];
    for (const cat of categorias) {
        const arr = pedidoAtual.pedidos[cat] || [];
        for (const item of arr) {
            itens.push({
                id_produto: item.id,
                quantidade: item.quantidade,
                preco_unitario: item.precoUnitario ?? item.preco
            });
        }
    }

    const res = await fetch(`${API_URL}/pagamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id_pessoa: idCliente,
            id_forma_pagamento: idFormaPagamento,
            status_pagamento: true, // obrigatório
            itens
        })
    });

    if (!res.ok) throw new Error(await res.text());

    localStorage.removeItem(PEDIDO_KEY);
    return await res.json();
}

async function pagar(metodo, idCliente) {
    if (!idCliente) {
        alert("Usuário inválido. Faça login novamente.");
        window.location.href = "../a-login/login.html";
        return;
    }

    if (metodo === 'cartao') {
        const cpf = document.getElementById('input_cpf')?.value;
        const endereco = document.getElementById('input_endereco')?.value;
        const numCartao = document.getElementById('input_cartao_num')?.value;

        if (!cpf || !endereco || !numCartao) { alert("Preencha todos os campos do cartão!"); return; }
        if (!validarCPF(cpf)) { alert("CPF inválido!"); return; }
        if (!validarCartao(numCartao)) { alert("Número de cartão inválido!"); return; }

        try {
            await registrarPedido(idCliente, 1); // 1 = cartão
            alert("Pagamento via cartão registrado com sucesso!");
            window.location.href = '../index.html';
        } catch (err) {
            console.error(err);
            alert("Erro ao registrar pagamento/cartão.");
        }

    } else if (metodo === 'pix') {
        try {
            await registrarPedido(idCliente, 2); // 2 = PIX
            await navigator.clipboard.writeText(PIX_CODE);
            alert("Código PIX copiado e pagamento registrado com sucesso!");
            window.location.href = '../index.html';
        } catch (err) {
            console.error(err);
            alert("Erro ao registrar pagamento PIX.");
        }
    } else {
        alert("Selecione um método de pagamento!");
    }
}

// ==============================
// Funções auxiliares
// ==============================
function getCookie(nome) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nome}=`);
    if (partes.length === 2) return decodeURIComponent(partes.pop().split(';').shift());
    return null;
}

function validarCPF(cpf) {
    const strCPF = cpf.replace(/\D/g, '');
    if (strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(strCPF[i]) * (10 - i);
    const digito1 = (soma % 11 < 2) ? 0 : 11 - (soma % 11);
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(strCPF[i]) * (11 - i);
    const digito2 = (soma % 11 < 2) ? 0 : 11 - (soma % 11);
    return parseInt(strCPF[9]) === digito1 && parseInt(strCPF[10]) === digito2;
}

function validarCartao(numeroCartao) {
    const numeroLimpo = numeroCartao.replace(/\D/g, '');
    if (numeroLimpo.length < 13 || numeroLimpo.length > 19) return false;
    let soma = 0, deveDobrar = false;
    for (let i = numeroLimpo.length - 1; i >= 0; i--) {
        let digito = parseInt(numeroLimpo[i]);
        if (deveDobrar) { digito *= 2; if (digito > 9) digito -= 9; }
        soma += digito;
        deveDobrar = !deveDobrar;
    }
    return soma % 10 === 0;
}
