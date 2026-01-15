/* =========================
   CONFIG GERAL
========================= */
const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyhE8_vAHx-Qkcl2byvZX5rr1OOEVAeBpFfETOWzsEK1W7kZOduGt5YKEeT4mwfgL5K/exec";

// setor via URL ?setor=Ambulatorio | ?setor=Pronto%20Socorro
const params = new URLSearchParams(window.location.search);
const SETOR = params.get("setor") || "Ambulatório";

console.log("Setor ativo:", SETOR);

/* =========================
   PERGUNTAS
========================= */
const perguntas = [
  {
    id: "nps",
    tipo: "nps",
    texto: "1 - Em uma escala de 0 a 10, o quanto você recomendaria este hospital a um amigo ou familiar?"
  },
  {
    id: "seguranca",
    tipo: "opcoes",
    texto: "2 - Você se sentiu seguro durante o atendimento?",
    comIcones: true,
    opcoes: [
      { valor: "Pouco Seguro", label: "Pouco Seguro", icone: "images/Insatisfeito.png" },
      { valor: "Seguro", label: "Seguro", icone: "images/Satisfeito.png" },
      { valor: "Muito Seguro", label: "Muito Seguro", icone: "images/Muito Satisfeito.png" }
    ]
  },
  {
    id: "clareza",
    tipo: "opcoes",
    texto: "3 - Como você avalia a clareza das informações recebidas?",
    comIcones: true,
    opcoes: [
      { valor: "Insatisfeito", label: "Insatisfeito", icone: "images/Insatisfeito.png" },
      { valor: "Satisfeito", label: "Satisfeito", icone: "images/Satisfeito.png" },
      { valor: "Muito Satisfeito", label: "Muito Satisfeito", icone: "images/Muito Satisfeito.png" }
    ]
  },
  {
    id: "etapa",
    tipo: "categorias",
    texto: "4 - Qual etapa mais impactou sua experiência?",
    opcoes: [
      "Recepção",
      "Enfermagem",
      "Médico",
      "Exames",
      "Hotelaria / Limpeza",
      "Alta / Orientações",
      "Tempo de Espera"
    ]
  },
  {
    id: "problema",
    tipo: "opcoes",
    texto: "5 - Você teve algum problema ou dificuldade durante o atendimento?",
    comImagens: true,  // ← ADICIONE ESTA LINHA
    opcoes: [
      { valor: "Sim", label: "Sim, tive!", imagem: "images/dificuldade.png" },  // ← MUDE
      { valor: "Não", label: "Não, está tudo bem!", imagem: "images/ok.png" }  // ← MUDE
    ],
    condicional: true
  }
];

/* =========================
   CONTROLE
========================= */
let indice = 0;
let respostas = {};
let bloqueado = false;
let tempoQRCode = 8;
let intervaloQRCode = null;

/* =========================
   ELEMENTOS
========================= */
const telaPergunta = document.getElementById("tela-pergunta");
const telaNPS = document.getElementById("tela-nps");
const telaCategorias = document.getElementById("tela-categorias");
const telaQRCode = document.getElementById("tela-qrcode");
const telaFinal = document.getElementById("tela-final");
const opcoesContainer = document.getElementById("opcoes-container");
const opcoesNPS = document.getElementById("opcoes-nps");
const opcoesCategorias = document.getElementById("opcoes-categorias");

/* =========================
   INICIALIZA
========================= */
mostrarPergunta();
reenviarFilaOffline();
console.log("JS carregado com sucesso");

/* =========================
   MOSTRAR PERGUNTA
========================= */
function mostrarPergunta() {
  const perguntaAtual = perguntas[indice];

  // Limpar telas
  ocultarTodasAsTelas();

  if (perguntaAtual.tipo === "nps") {
    mostrarTelaNPS(perguntaAtual);
  } else if (perguntaAtual.tipo === "opcoes") {
    mostrarTelaOpcoes(perguntaAtual);
  } else if (perguntaAtual.tipo === "categorias") {
    mostrarTelaCategorias(perguntaAtual);
  }
}

function ocultarTodasAsTelas() {
  telaPergunta.classList.add("hidden");
  telaNPS.classList.add("hidden");
  telaCategorias.classList.add("hidden");
  telaQRCode.classList.add("hidden");
  telaFinal.classList.add("hidden");
}

function mostrarTelaNPS(pergunta) {
  document.getElementById("pergunta-nps").innerText = pergunta.texto;
  opcoesNPS.innerHTML = "";

  for (let i = 0; i <= 10; i++) {
    const btn = document.createElement("button");
    btn.className = `nps-${i}`;
    btn.innerText = i;
    btn.onclick = () => responderNPS(i);
    opcoesNPS.appendChild(btn);
  }

  telaNPS.classList.remove("hidden");
}

function mostrarTelaOpcoes(pergunta) {
  document.getElementById("pergunta").innerText = pergunta.texto;
  opcoesContainer.innerHTML = "";

  pergunta.opcoes.forEach(opcao => {
    const btn = document.createElement("button");
    
    if (pergunta.comIcones) {
      btn.innerHTML = `
        <img src="${opcao.icone}" alt="${opcao.label}">
        <span>${opcao.label}</span>
      `;
    } else if (pergunta.comImagens) {  // ← NOVA CONDIÇÃO
      btn.innerHTML = `
        <img src="${opcao.imagem}" alt="${opcao.label}">
        <span><strong>${opcao.label}</strong></span>
      `;
    } else {
      btn.innerHTML = `<span>${opcao.label}</span>`;
    }
    
    btn.onclick = () => responderOpcao(opcao.valor, pergunta);
    opcoesContainer.appendChild(btn);
  });

  telaPergunta.classList.remove("hidden");
}

function mostrarTelaCategorias(pergunta) {
  document.getElementById("pergunta-categorias").innerText = pergunta.texto;
  opcoesCategorias.innerHTML = "";

  pergunta.opcoes.forEach(opcao => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "categoria";
    input.value = opcao;
    input.onchange = () => responderCategoria(opcao);

    label.appendChild(input);
    label.appendChild(document.createTextNode(opcao));
    opcoesCategorias.appendChild(label);
  });

  telaCategorias.classList.remove("hidden");
}

/* =========================
   RESPONDER
========================= */
ffunction responderNPS(valor) {
  if (bloqueado) return;
  bloqueado = true;

  const perguntaAtual = perguntas[indice];
  respostas[perguntaAtual.id] = String(valor);  // ← MUDE PARA String(valor)

  proximaPergunta();
}

function responderOpcao(valor, pergunta) {
  if (bloqueado) return;
  bloqueado = true;

  respostas[pergunta.id] = valor;

  // Verificar se é pergunta com condicional (problema)
  if (pergunta.condicional && valor === "Sim") {
    mostrarTelaQRCode();
  } else {
    proximaPergunta();
  }
}

function responderCategoria(valor) {
  if (bloqueado) return;
  bloqueado = true;

  const perguntaAtual = perguntas[indice];
  respostas[perguntaAtual.id] = valor;

  proximaPergunta();
}

/* =========================
   PRÓXIMA PERGUNTA
========================= */
function proximaPergunta() {
  animarTrocaPergunta(() => {
    indice++;

    if (indice < perguntas.length) {
      mostrarPergunta();
      bloqueado = false;
    } else {
      finalizarPesquisa();
    }
  });
}

/* =========================
   TELA QR CODE
========================= */
function mostrarTelaQRCode() {
  ocultarTodasAsTelas();
  telaQRCode.classList.remove("hidden");

  tempoQRCode = 8;
  document.getElementById("tempo-restante").innerText = tempoQRCode;

  // Limpar intervalo anterior se existir
  if (intervaloQRCode) clearInterval(intervaloQRCode);

  intervaloQRCode = setInterval(() => {
    tempoQRCode--;
    document.getElementById("tempo-restante").innerText = tempoQRCode;

    if (tempoQRCode <= 0) {
      clearInterval(intervaloQRCode);
      prosseguirDoQRCode();
    }
  }, 1000);
}

function prosseguirDoQRCode() {
  if (intervaloQRCode) clearInterval(intervaloQRCode);
  finalizarPesquisa();
}

/* =========================
   ANIMAÇÃO
========================= */
function animarTrocaPergunta(callback) {
  const telaAtiva = document.querySelector(".tela:not(.hidden)");

  if (telaAtiva) {
    telaAtiva.classList.add("saindo");

    setTimeout(() => {
      telaAtiva.classList.remove("saindo");
      telaAtiva.classList.add("entrando");

      setTimeout(() => {
        telaAtiva.classList.remove("entrando");
        callback();
      }, 120);
    }, 300);
  } else {
    callback();
  }
}

/* =========================
   FINALIZAR
========================= */
function finalizarPesquisa() {
  mostrarTelaFinal();
  enviarDados();
}

/* =========================
   ENVIO
========================= */
function enviarDados() {
  const dados = new URLSearchParams();
  dados.append("setor", SETOR);

  perguntas.forEach(p => {
    dados.append(p.id, respostas[p.id] !== undefined ? respostas[p.id] : "");  // ← NOVA
  });
}
/* =========================
   OFFLINE
========================= */
function salvarOffline(payload) {
  const fila = JSON.parse(localStorage.getItem("fila_respostas") || "[]");
  fila.push(payload);
  localStorage.setItem("fila_respostas", JSON.stringify(fila));
}

window.addEventListener("online", reenviarFilaOffline);

function reenviarFilaOffline() {
  const fila = JSON.parse(localStorage.getItem("fila_respostas") || "[]");
  if (!fila.length) return;

  const restante = [];

  fila.forEach(payload => {
    fetch(URL_APPS_SCRIPT, {
      method: "POST",
      body: payload,
      mode: "no-cors"
    }).catch(() => restante.push(payload));
  });

  localStorage.setItem("fila_respostas", JSON.stringify(restante));
}

/* =========================
   TELA FINAL / RESET
========================= */
function mostrarTelaFinal() {
  ocultarTodasAsTelas();
  telaFinal.classList.remove("hidden");

  setTimeout(reiniciar, 3000);
}

function reiniciar() {
  indice = 0;
  respostas = {};
  bloqueado = false;
  tempoQRCode = 8;

  if (intervaloQRCode) clearInterval(intervaloQRCode);

  mostrarPergunta();
}
