// main.js - GGO_DONALD'S 2.0 (com login seguro e cardápio)

// ========== VARIÁVEIS GLOBAIS ==========
const PEDIDO_KEY = "pedidoAtual";
const USUARIO_KEY = "usuario";
let cardapioCompleto = {};
let pedidos = { hamburgueres: {}, acompanhamentos: {}, bebidas: {} };
let categoriaAtual = "hamburgueres";
let cardapioCarregado = false;
const API_BASE = "http://localhost:3001/";
const CSV_FALLBACK = "./CSVs/produtos.csv";

// ========== INICIALIZAÇÃO ==========
document.addEventListener("DOMContentLoaded", inicializarAplicacao);

async function inicializarAplicacao() {
  carregarPedidosSalvosLocalStorage();
  await carregarUsuario();

  // ✅ Debug: logar usuário no main
  const usuarioStr = getCookie(USUARIO_KEY);
  if (usuarioStr) {
    const usuario = JSON.parse(usuarioStr);
    console.log("Usuário no main:", usuario);
  }

  try {
    await carregarProdutosAPI();
    console.log("Cardápio carregado da API.");
  } catch (errApi) {
    console.warn("Falha ao carregar da API, tentando CSV...", errApi);
    try {
      await carregarCSV(CSV_FALLBACK);
      console.log("Cardápio carregado do CSV.");
    } catch (errCsv) {
      console.error("Falha ao carregar cardápio (API e CSV):", errCsv);
      mostrarErroCarregamento();
      return;
    }
  }

  configurarEventListeners();
  carregarCategoria(categoriaAtual);
  cardapioCarregado = true;
}

// ========== LOGIN ==========
async function carregarUsuario() {
  const cookieUsuario = getCookie(USUARIO_KEY);
  const userDiv = document.querySelector(".user");
  if (!userDiv) return;

  if (cookieUsuario) {
    try {
      const usuario = JSON.parse(cookieUsuario);
      renderUsuarioLogado(userDiv, usuario);
    } catch {
      renderLoginButtons(userDiv);
    }
  } else {
    renderLoginButtons(userDiv);
  }
}

function renderUsuarioLogado(container, usuario) {
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.innerHTML = `
    <div class="usuario-dropdown" style="position: relative; display: flex; align-items: center;">
      <div class="usuario-avatar" id="usuarioAvatar" title="Clique para mais opções" style="cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <img src="../../assets/user.svg" alt="Ícone de Usuário" style="width: 24px; height: 24px;">
      </div>
      <div class="usuario-menu" id="usuarioMenu" style="display: none; position: absolute; background: white; border: 1px solid #ccc; border-radius: 8px; padding: 10px; margin-top: 8px; right: 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 150px;">
        <div class="usuario-nome-menu" style="font-weight: 600; margin-bottom: 10px;">${escapeHtml(usuario.nome ?? "Usuário")}</div>
        <button onclick="logoutUsuario()" class="dropdown-btn" style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Sair</button>
      </div>
    </div>
  `;

  if (usuario.tipo === "adm") {
    const btnAdm = document.createElement("button");
    btnAdm.textContent = "Admin";
    btnAdm.className = "admin-btn";
    btnAdm.style.marginLeft = "10px";
    btnAdm.addEventListener("click", () => window.location.href = "./a-crud/crud.html");
    container.appendChild(btnAdm);
  }

  const avatar = document.getElementById("usuarioAvatar");
  const menu = document.getElementById("usuarioMenu");
  avatar?.addEventListener("click", e => { e.stopPropagation(); menu.style.display = menu.style.display === "block" ? "none" : "block"; });
  document.addEventListener("click", e => { if (!avatar.contains(e.target) && !menu.contains(e.target)) menu.style.display = "none"; });
}

function renderLoginButtons(container) {
  container.innerHTML = `
    <button class="criar_entrar_conta" onclick="window.location.href='./a-criar_login/cadastro.html'">Criar Conta</button>
    <button class="criar_entrar_conta" onclick="window.location.href='./a-login/login.html'">Entrar</button>
  `;
}

function logoutUsuario() {
  document.cookie = USUARIO_KEY + "=; max-age=0; path=/";
  localStorage.removeItem(PEDIDO_KEY);
  pedidos = { hamburgueres: {}, acompanhamentos: {}, bebidas: {} };
  window.location.href = "./index.html";
}

// ========== LOCALSTORAGE ==========
function carregarPedidosSalvosLocalStorage() {
  const pedidoSalvo = localStorage.getItem(PEDIDO_KEY);
  if (!pedidoSalvo) return;
  try {
    const parsed = JSON.parse(pedidoSalvo);
    pedidos = { hamburgueres: {}, acompanhamentos: {}, bebidas: {} };
    for (const cat in parsed.pedidos) {
      parsed.pedidos[cat].forEach(item => {
        pedidos[cat][item.id] = item.quantidade;
      });
    }
  } catch {
    localStorage.removeItem(PEDIDO_KEY);
  }
}

// ========== CARREGAR CARDÁPIO ==========
async function carregarProdutosAPI() {
  const resp = await fetch(API_BASE + "produto");
  if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
  const produtos = await resp.json();
  processarProdutosAPI(produtos);
}

function processarProdutosAPI(produtos) {
  cardapioCompleto = {};
  produtos.forEach(p => {
    const cat = (p.nome_categoria ?? "").toLowerCase();
    let categoriaPedidos;
    if (["hamburguer", "hamburgueres"].includes(cat)) categoriaPedidos = "hamburgueres";
    else if (["acompanhamento", "porcao", "porções"].includes(cat)) categoriaPedidos = "acompanhamentos";
    else if (["bebida", "bebidas"].includes(cat)) categoriaPedidos = "bebidas";
    else return;

    const idProduto = p.id_produto ?? p.id ?? p.idProduto;
    if (!idProduto) return;

    let img = p.caminho_imagem ?? "./assets/imagem-padrao.jpg";
    if (img && !img.match(/^https?:\/\//)) img = API_BASE + img.replace(/^\//, "");

    cardapioCompleto[`${categoriaPedidos}_${idProduto}`] = {
      id: String(idProduto),
      nome: p.nome ?? "Produto",
      preco: parseFloat(p.preco ?? 0),
      imagem: img,
      categoria: categoriaPedidos === "hamburgueres" ? "hamburguer" : categoriaPedidos === "acompanhamentos" ? "acompanhamento" : "bebida"
    };
  });
}

async function carregarCSV(arquivo) {
  const resp = await fetch(arquivo);
  if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
  const data = await resp.text();
  processarCSV(data);
}

function processarCSV(csv) {
  const linhas = csv.trim().split("\n");
  const cabecalhos = linhas[0].split(";").map(h => h.trim());
  const headerMap = { id: cabecalhos.indexOf("id"), nome: cabecalhos.indexOf("nome"), preco: cabecalhos.indexOf("preco"), caminho__img: cabecalhos.indexOf("caminho__img"), categoria: cabecalhos.indexOf("categoria") };

  cardapioCompleto = {};
  for (let i = 1; i < linhas.length; i++) {
    if (!linhas[i].trim()) continue;
    const vals = linhas[i].split(";").map(v => v.trim());
    const id = vals[headerMap.id], nome = vals[headerMap.nome] ?? "Produto", preco = parseFloat((vals[headerMap.preco]||0).replace(",", ".")), img = vals[headerMap.caminho__img] || "./assets/imagem-padrao.jpg";
    const catCSV = (vals[headerMap.categoria] || "").toLowerCase();
    let categoriaPedidos;
    if (catCSV === "hamburguer") categoriaPedidos = "hamburgueres";
    else if (catCSV === "acompanhamento") categoriaPedidos = "acompanhamentos";
    else if (catCSV === "bebida") categoriaPedidos = "bebidas";
    else continue;

    cardapioCompleto[`${categoriaPedidos}_${id}`] = { id: String(id), nome, preco, imagem: img, categoria: catCSV };
  }
}

// ========== CATEGORIAS ==========
function carregarCategoria(categoria) {
  categoriaAtual = categoria;
  const itens = Object.keys(cardapioCompleto)
    .filter(key => cardapioCompleto[key].categoria === (categoria === "hamburgueres" ? "hamburguer" : categoria === "acompanhamentos" ? "acompanhamento" : "bebida"))
    .map(key => ({ ...cardapioCompleto[key], idUnico: key, id: key.split("_")[1] }));
  gerarCardapio(itens);
}

// ========== GERAR CARDÁPIO ==========
function gerarCardapio(itens) {
  const container = document.querySelector(".cardapio");
  if (!container) return;
  container.innerHTML = "";
  if (!itens.length) { container.innerHTML = '<p class="sem-itens">Nenhum item nesta categoria.</p>'; return; }

  const frag = document.createDocumentFragment();
  itens.forEach(item => {
    const s = document.createElement("section");
    s.className = "item-cardapio";
    s.innerHTML = `<img src="${item.imagem}" alt="${escapeHtml(item.nome)}" onerror="this.onerror=null;this.src='./assets/imagem-padrao.jpg'">
                   <p><strong>${escapeHtml(item.nome)}</strong><br>R$ ${Number(item.preco).toFixed(2)}</p>
                   <input type="number" data-id="${item.idUnico}" class="quantidade" min="0">`;
    frag.appendChild(s);
  });
  container.appendChild(frag);
  configurarEventListenersQuantidade();
  atualizarQuantidadesNosInputs();
}

// ========== QUANTIDADES ==========
function configurarEventListenersQuantidade() {
  const container = document.querySelector(".cardapio");
  container.addEventListener("input", e => { if (e.target.classList.contains("quantidade")) atualizarQuantidade.call(e.target); });
  container.addEventListener("change", e => { if (e.target.classList.contains("quantidade")) validarQuantidade.call(e.target); });
}

function atualizarQuantidadesNosInputs() {
  document.querySelectorAll(".quantidade").forEach(input => {
    const [cat, id] = input.dataset.id.split("_");
    input.value = pedidos[cat]?.[id] ?? "";
  });
}

function atualizarQuantidade() {
  const [cat, id] = this.dataset.id.split("_");
  let qtd = parseInt(this.value);
  if (isNaN(qtd) || qtd < 0) qtd = 0;
  if (!pedidos[cat]) pedidos[cat] = {};
  if (qtd > 0) pedidos[cat][id] = qtd; else delete pedidos[cat][id];

  salvarPedidoLocalStorage(); // Atualiza o localStorage e renova cookie
}

function validarQuantidade() {
  const val = parseInt(this.value);
  if (isNaN(val) || val < 0) this.value = "0";
}

// ========== SALVAR LOCALSTORAGE ==========
function salvarPedidoLocalStorage() {
  const pedidoSalvo = { data: new Date().toLocaleString("pt-BR"), pedidos: {}, totalGeral: 0, itensTotais: 0 };
  for (const cat in pedidos) {
    pedidoSalvo.pedidos[cat] = [];
    for (const id in pedidos[cat]) {
      const idCompleto = `${cat}_${id}`;
      const item = cardapioCompleto[idCompleto];
      const qtd = pedidos[cat][id];
      const precoUnit = item?.preco ?? 0;
      const precoTotal = parseFloat((precoUnit * qtd).toFixed(2));
      pedidoSalvo.pedidos[cat].push({ id, nome: item?.nome ?? "Produto", precoUnitario: precoUnit, quantidade: qtd, precoTotal });
      pedidoSalvo.totalGeral += precoTotal;
      pedidoSalvo.itensTotais += qtd;
    }
  }
  pedidoSalvo.totalGeral = parseFloat(pedidoSalvo.totalGeral.toFixed(2));

  // Salva no localStorage
  localStorage.setItem(PEDIDO_KEY, JSON.stringify(pedidoSalvo));

  // Renova cookie do usuário para manter sessão ativa
  const usuarioStr = getCookie(USUARIO_KEY);
  if (usuarioStr) {
    try {
      const usuario = JSON.parse(usuarioStr);
      salvarUsuario(usuario);
    } catch {}
  }
}

// ========== EVENTOS GLOBAIS ==========
function configurarEventListeners() {
  document.querySelectorAll(".cabecalho__nav .comidas").forEach(btn => {
    btn.addEventListener("click", function() {
      const map = { hamburguer: "hamburgueres", porcoes: "acompanhamentos", "porções": "acompanhamentos", bebidas: "bebidas" };
      const destino = map[this.id];
      if (destino) carregarCategoria(destino);
    });
  });

  document.querySelector("#menu")?.addEventListener("click", () => {
    const lista = document.querySelector(".menu__opcoes");
    const menuBtn = document.querySelector("#menu");
    if (!lista || !menuBtn) return;
    const vis = lista.style.display === "block";
    lista.style.display = vis ? "none" : "block";
    menuBtn.style.border = vis ? "none" : "1px solid black";
  });

  document.addEventListener("click", e => {
    const menuBtn = document.querySelector("#menu");
    const lista = document.querySelector(".menu__opcoes");
    if (!menuBtn || !lista) return;
    if (lista.style.display === "block" && !menuBtn.contains(e.target) && !lista.contains(e.target)) {
      lista.style.display = "none";
      menuBtn.style.border = "none";
    }
  });

  document.querySelector("form")?.addEventListener("submit", e => { e.preventDefault(); gerarJSONPedido(); });
}

// ========== GERAR PEDIDO ==========
function gerarJSONPedido() {
  const usuarioStr = getCookie(USUARIO_KEY);
  if (!usuarioStr) { alert("Você precisa estar logado!"); return; }

  const pedidoTemItens = Object.values(pedidos).some(cat => Object.keys(cat).length > 0);
  if (!pedidoTemItens) { alert("Selecione ao menos um produto!"); return; }

  salvarPedidoLocalStorage();
  window.location.href = "./a-conta/conta.html";
}

// ========== UTILITÁRIOS ==========
function mostrarErroCarregamento() {
  const c = document.querySelector(".cardapio");
  if (c) c.innerHTML = '<p class="sem-itens" style="color:red;text-align:center;padding:20px;">Erro ao carregar o cardápio.</p>';
}

function getCookie(nome) {
  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nome}=`);
  if (partes.length === 2) return decodeURIComponent(partes.pop().split(";").shift());
  return null;
}

function escapeHtml(text) {
  return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function salvarUsuario(usuario) {
    if (!usuario.id && !usuario.id_pessoa) {
        console.error("Usuário sem ID! Não pode salvar.");
        return;
    }
    const expireDays = 7;
    const d = new Date();
    d.setTime(d.getTime() + (expireDays*24*60*60*1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${USUARIO_KEY}=${encodeURIComponent(JSON.stringify(usuario))}; ${expires}; path=/`;
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}
