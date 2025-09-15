// =======================
// CONFIGURAÇÃO DA API
// =======================
const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

// =======================
// ELEMENTOS DO DOM
// =======================
const form = document.getElementById('edicao');
const searchId = document.getElementById('searchId');

const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

const radios = document.querySelectorAll('input[name="section"]');
const sections = document.querySelectorAll('.section-form');

const tableFuncionario = document.getElementById('tableFuncionario');
const tablePessoa = document.getElementById('tablePessoa');
const tableProduto = document.getElementById('tableProduto');
const tableCategoria = document.getElementById('tableCategoria');
const tableCargo = document.getElementById('tableCargo');

const msgBox = document.createElement('div');
msgBox.id = 'msgBox';
msgBox.style.cssText = `
    position: fixed; top: 10px; right: 10px; padding: 10px 20px;
    border-radius: 5px; background-color: #4caf50; color: #fff;
    display: none; z-index: 999;
`;
document.body.appendChild(msgBox);

// Pegar usuário logado
const usuarioStr = getCookie("usuario");
let usuarioLogado = null;
if (usuarioStr) {
    usuarioLogado = JSON.parse(usuarioStr);
}

// =======================
// INICIALIZAÇÃO
// =======================
document.addEventListener('DOMContentLoaded', async () => {
    radios.forEach(radio => radio.addEventListener('change', async () => await setSection(radio.value)));
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

form.addEventListener('submit', e => e.preventDefault());

// =======================
// UI helpers
// =======================
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function bloquearCampos(editavel) {
    form.querySelectorAll('input, select').forEach(input => {
        if (input === searchId) return;
        input.disabled = !editavel;
    });
}

function limparFormulario() {
    form.reset();
    form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
}

function mostrarMensagem(msg, tipo = 'sucesso') {
    msgBox.textContent = msg;
    msgBox.style.backgroundColor = tipo === 'erro' ? '#f44336' : '#4caf50';
    msgBox.style.display = 'block';
    setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
}

// =======================
// mudança de seção (radio)
// =======================
async function setSection(section) {
    radios.forEach(r => r.checked = r.value === section);
    sections.forEach(s => s.style.display = 'none');

    const selectedForm = document.getElementById(section);
    if (selectedForm) selectedForm.style.display = 'block';

    limparFormulario();

    if (section === 'produto') await carregarCategorias();
    if (section === 'funcionario') await carregarCargos();

    await carregarTabela(section);

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
}

// =======================
// CRUD
// =======================
async function buscarRegistro() {
    const id = searchId.value.trim();
    if (!id) return mostrarMensagem('Digite um ID', 'erro');

    const section = getSelectedSection();
    if (!section) return mostrarMensagem('Selecione uma seção', 'erro');

    try {
        if (section === 'produto') await carregarCategorias();
        if (section === 'funcionario') await carregarCargos();

        const res = await fetch(`${API_BASE_URL}/${section}/${id}`);
        if (res.ok) {
            const data = await res.json();
            preencherFormulario(data, section);

            // Bloquear ações de acordo com permissões
            if (section === 'funcionario') {
                bloquearAcoesFuncionario(data);
            }

            mostrarBotoes(true, false, true, true, false, false);
            bloquearCampos(false);
            searchId.disabled = true;
        } else if (res.status === 404) {
            limparFormulario();
            mostrarBotoes(true, true, false, false, false, false);
            bloquearCampos(false);
            searchId.disabled = false;
            mostrarMensagem('Registro não encontrado. Você pode incluir um novo.', 'erro');
        } else {
            mostrarMensagem('Erro ao buscar registro', 'erro');
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro na requisição de busca', 'erro');
    }
}

function bloquearAcoesFuncionario(data) {
    const registroCargo = data.id_cargo;
    const registroId = data.id_funcionario;

    if (!usuarioLogado) return;

    // ADM (2) não pode se auto-alterar/excluir nem outro ADM
    if (usuarioLogado.id_cargo === 2) {
        if (registroCargo === 2 || registroId === usuarioLogado.id_pessoa) {
            btnAlterar.disabled = true;
            btnExcluir.disabled = true;
        } else {
            btnAlterar.disabled = false;
            btnExcluir.disabled = false;
        }
    }

    // CHEFE (3) não pode se auto-excluir
    if (usuarioLogado.id_cargo === 3) {
        btnAlterar.disabled = false;
        btnExcluir.disabled = registroId === usuarioLogado.id_pessoa;
    }
}

// =======================
// Salvar operação (incluir/alterar/excluir)
// =======================
async function salvarOperacao() {
    const section = getSelectedSection();
    if (!section) return mostrarMensagem('Selecione uma seção', 'erro');

    const inputs = document.querySelectorAll(`#${section} input, #${section} select`);
    let payload = {};
    let formData = null;
    let usarFormData = false;

    if (section === 'produto') {
        usarFormData = Array.from(inputs).some(i => i.id === 'produtoImg' && i.files.length > 0);
        if (usarFormData) formData = new FormData();
    }

    inputs.forEach(input => {
        if (input === searchId) return;

        if (section === 'produto') {
            switch (input.id) {
                case 'produtoNome': usarFormData ? formData.append("nome", input.value) : payload.nome = input.value; break;
                case 'produtoCategoria': usarFormData ? formData.append("id_categoria", input.value ? parseInt(input.value) : '') : payload.id_categoria = input.value ? parseInt(input.value) : null; break;
                case 'produtoImg': if (usarFormData && input.files.length) formData.append("imagem", input.files[0]); break;
                case 'produtoQtd': usarFormData ? formData.append("quantidade_estoque", input.value ? parseInt(input.value) : 0) : payload.quantidade_estoque = input.value ? parseInt(input.value) : 0; break;
                case 'produtoData': usarFormData ? formData.append("data_fabricacao", input.value || '') : payload.data_fabricacao = input.value || null; break;
                case 'produtoPreco': usarFormData ? formData.append("preco", input.value ? parseFloat(input.value) : 0) : payload.preco = input.value ? parseFloat(input.value) : 0; break;
            }
        } else if (section === 'pessoa') {
            if (input.id === 'pessoaNome') payload.nome = input.value;
            if (input.id === 'pessoaEmail') payload.email = input.value;
            if (input.id === 'pessoaSenha') payload.senha = input.value;
        } else if (section === 'categoria') {
            if (input.id === 'catNome') payload.nome_categoria = input.value;
        } else if (section === 'funcionario') {
            if (input.id === 'funcData') payload.data_inicio = input.value;
            if (input.id === 'funcSalario') payload.salario = input.value ? parseFloat(input.value) : 0;
            if (input.id === 'funcCargo') payload.id_cargo = input.value ? parseInt(input.value) : null;
        } else if (section === 'cargo') {
            if (input.id === 'cargoNome') payload.nome_cargo = input.value;
        }
    });

    // =======================
    // Validação de permissões
    // =======================
    if ((operacao === 'alterar' || operacao === 'excluir') && section === 'funcionario') {
        const registroId = currentId;
        const registroCargo = payload.id_cargo || currentId;

        if (usuarioLogado.id_cargo === 2) { // ADM
            if (registroCargo === 2 || registroId === usuarioLogado.id_pessoa) {
                return mostrarMensagem("Você não tem permissão para alterar/excluir este registro.", "erro");
            }
        }
        if (usuarioLogado.id_cargo === 3) { // CHEFE
            if (operacao === 'excluir' && registroId === usuarioLogado.id_pessoa) {
                return mostrarMensagem("Você não pode se auto-excluir.", "erro");
            }
        }
    }

    // =======================
    // Validações comuns
    // =======================
    if (section === 'produto' && (payload.id_categoria === null || Number.isNaN(payload.id_categoria))) {
        return mostrarMensagem('Selecione uma categoria válida para o produto.', 'erro');
    }
    if (section === 'pessoa' && (!payload.nome || !payload.email || !payload.senha)) {
        return mostrarMensagem('Nome, email e senha são obrigatórios para pessoa.', 'erro');
    }

    let url = `${API_BASE_URL}/${section}`;
    let method = 'POST';
    if (operacao === 'alterar') {
        if (!currentId) return mostrarMensagem('ID inválido para alterar', 'erro');
        url += `/${currentId}`;
        method = 'PUT';
    } else if (operacao === 'excluir') {
        if (!currentId) return mostrarMensagem('ID inválido para excluir', 'erro');
        url += `/${currentId}`;
        method = 'DELETE';
    }

    if (operacao === 'excluir' && !confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
        const options = { method };
        if (method !== 'DELETE') {
            if (section === 'produto' && usarFormData && formData) options.body = formData;
            else {
                options.headers = { 'Content-Type': 'application/json' };
                options.body = JSON.stringify(payload);
            }
        }

        const res = await fetch(url, options);
        if (res.ok) {
            mostrarMensagem(operacao === 'excluir' ? 'Registro excluído com sucesso!' : 'Operação realizada com sucesso!');
            limparFormulario();
            mostrarBotoes(true, false, false, false, false, false);
            bloquearCampos(false);
            searchId.disabled = false;
            await carregarTabela(section);
        } else {
            const errBody = await res.json().catch(() => null);
            mostrarMensagem((errBody?.error || errBody?.message) || `Erro na operação (${res.status})`, 'erro');
        }
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro na requisição ao salvar', 'erro');
    }
}

// =======================
// Operações
// =======================
function incluirRegistro() {
    operacao = 'incluir';
    currentId = null;
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
}

function alterarRegistro() {
    operacao = 'alterar';
    if (!searchId.value) return mostrarMensagem('Digite o ID antes de alterar', 'erro');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
}

function excluirRegistro() {
    operacao = 'excluir';
    if (!searchId.value) return mostrarMensagem('Digite o ID antes de excluir', 'erro');
    mostrarBotoes(false, false, false, false, true, true);
}

function cancelarOperacao() {
    operacao = null;
    currentId = null;
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.disabled = false;
}

// =======================
// Preencher formulário
// =======================
function preencherFormulario(data, section) {
    if (!data || typeof data !== 'object') return;

    form.querySelectorAll(`#${section} input, #${section} select`).forEach(input => {
        if (input === searchId) return;

        let key = input.id;
        if (section === 'produto') {
            if (input.id === 'produtoNome') key = 'nome';
            else if (input.id === 'produtoCategoria') key = 'id_categoria';
            else if (input.id === 'produtoQtd') key = 'quantidade_estoque';
            else if (input.id === 'produtoData') key = 'data_fabricacao';
            else if (input.id === 'produtoPreco') key = 'preco';
            if (input.type === 'file') return;
        } else if (section === 'pessoa') {
            if (input.id === 'pessoaNome') key = 'nome';
            if (input.id === 'pessoaEmail') key = 'email';
            if (input.id === 'pessoaSenha') key = 'senha';
        } else if (section === 'categoria') key = 'nome_categoria';
        else if (section === 'funcionario') {
            if (input.id === 'funcData') key = 'data_inicio';
            if (input.id === 'funcSalario') key = 'salario';
            if (input.id === 'funcCargo') key = 'id_cargo';
        } else if (section === 'cargo') key = 'nome_cargo';

        const value = data[key];
        if (value !== undefined && value !== null) {
            if (input.tagName === 'SELECT') input.value = String(value);
            else if (input.type === 'date') input.value = String(value).split('T')[0];
            else input.value = value;
        }
    });

    currentId = data.id_funcionario || data.id_pessoa || data.id_produto || data.id_categoria || data.id_cargo || data.id || searchId.value;
    if (currentId) searchId.value = currentId;
}

// =======================
// Carregar selects
// =======================
async function carregarCategorias() {
    try {
        const res = await fetch(`${API_BASE_URL}/categoria`);
        const categorias = await res.json();
        const select = document.getElementById('produtoCategoria');
        select.innerHTML = '<option value="">Selecione a Categoria</option>';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id_categoria;
            opt.textContent = cat.nome_categoria;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar categorias', 'erro');
    }
}

async function carregarCargos() {
    try {
        const res = await fetch(`${API_BASE_URL}/cargo`);
        const cargos = await res.json();
        const select = document.getElementById('funcCargo');
        select.innerHTML = '<option value="">Selecione o Cargo</option>';
        cargos.forEach(cargo => {
            const opt = document.createElement('option');
            opt.value = cargo.id_cargo;
            opt.textContent = cargo.nome_cargo;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar cargos', 'erro');
    }
}

// =======================
// Carregar tabela
// =======================
async function carregarTabela(section) {
    try {
        const tables = { funcionario: tableFuncionario, pessoa: tablePessoa, produto: tableProduto, categoria: tableCategoria, cargo: tableCargo };
        Object.values(tables).forEach(tbl => { if (tbl) { tbl.style.display = 'none'; tbl.innerHTML = ''; } });

        const res = await fetch(`${API_BASE_URL}/${section}`);
        if (!res.ok) return;

        const registros = await res.json();
        const container = tables[section];
        if (!container) return;
        container.style.display = 'block';
        if (!registros.length) return container.innerHTML = '<p>Nenhum registro encontrado</p>';

        const table = document.createElement('table');
        table.classList.add('styled-table');

        const keys = Object.keys(registros[0]);
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const thAction = document.createElement('th');
        thAction.textContent = 'Ação';
        headerRow.appendChild(thAction);
        keys.forEach(k => { const th = document.createElement('th'); th.textContent = capitalize(k); headerRow.appendChild(th); });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const idKey = keys.find(k => k.startsWith('id_')) || keys[0];
        registros.forEach(reg => {
            const tr = document.createElement('tr');
            const tdAction = document.createElement('td');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = 'Abrir';
            btn.addEventListener('click', () => {
                setSection(section).then(() => {
                    searchId.value = reg[idKey];
                    buscarRegistro();
                });
            });
            tdAction.appendChild(btn);
            tr.appendChild(tdAction);

            keys.forEach(k => {
                const td = document.createElement('td');
                td.textContent = reg[k];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro ao carregar tabela', 'erro');
    }
}

function voltar() {
    window.location.href = '../index.html'; // ajusta o caminho conforme necessário
}

document.getElementById('btnVoltar').addEventListener('click', voltar);

// =======================
// Helpers
// =======================
function getSelectedSection() {
    const radio = document.querySelector('input[name="section"]:checked');
    return radio ? radio.value : null;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCookie(nome) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nome}=`);
    if (partes.length === 2) return decodeURIComponent(partes.pop().split(';').shift());
    return null;
}

// =======================
// Eventos dos botões
// =======================
btnBuscar.addEventListener('click', buscarRegistro);
btnIncluir.addEventListener('click', incluirRegistro);
btnAlterar.addEventListener('click', alterarRegistro);
btnExcluir.addEventListener('click', excluirRegistro);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);
