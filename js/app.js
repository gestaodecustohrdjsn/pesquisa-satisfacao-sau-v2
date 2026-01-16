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
    texto: "1 - EM UMA ESCALA DE 0 A 10, O QUANTO VOCÊ RECOMENDARIA ESTE HOSPITAL A UM AMIGO OU FAMILIAR?"
  },
  {
    id: "seguranca",
    tipo: "opcoes",
    texto: "2 - VOCÊ SE SENTIU SEGURO DURANTE O ATENDIMENTO?",
    comIcones: true,
    opcoes: [
      { valor: "Pouco Seguro", label: "POUCO SEGURO", icone: "images/Insatisfeito.png" },
      { valor: "Seguro", label: "SEGURO", icone: "images/Satisfeito.png" },
      { valor: "Muito Seguro", label: "MUITO SEGURO", icone: "images/Muito Satisfeito.png" }
    ]
  },
  {
    id: "clareza",
    tipo: "opcoes",
    texto: "3 - COMO VOCÊ AVALIA A CLAREZA DAS INFORMAÇÕES RECEBIDAS?",
    comIcones: true,
    opcoes: [
      { valor: "Insatisfeito", label: "INSATISFEITO", icone: "images/Insatisfeito.png" },
      { valor: "Satisfeito", label: "SATISFEITO", icone: "images/Satisfeito.png" },
      { valor: "Muito Satisfeito", label: "MUITO SATISFEITO", icone: "images/Muito Satisfeito.png" }
    ]
  },
    {
    id: "etapa",
    tipo: "categorias",
    texto: "4 - QUAL ETAPA MAIS IMPACTOU SUA EXPERIÊNCIA?",
    comIcones: true,  // ← ADICIONE ISTO
    opcoes: [
      { label: "RECEPÇÃO", icone: "images/recepção.png" },
      { label: "ENFERMAGEM", icone: "images/enfermagem.png" },
      { label: "MÉDICO", icone: "images/medico.png" },
      { label: "EXAMES", icone: "images/exames.png" },
      { label: "HOTELARIA / LIMPEZA", icone: "images/limpeza.png" },
      { label: "ALTA / ORIENTAÇÕES", icone: "images/alta.png" },
      { label: "TEMPO DE ESPERA", icone: "images/tempo.png" }
    ]
  },
  {
    id: "problema",
    tipo: "opcoes",
    texto: "5 - VOCÊ TEVE ALGUM PROBLEMA OU DIFICULDADE DURANTE O ATENDIMENTO?",
    comImagens: true,  // ← ADICIONE ESTA LINHA
    opcoes: [
      { valor: "Sim", label: "TIVE UM PROBLEMA OU DIFICULDADE!", imagem: "images/dificuldade.png" },
      { valor: "Não", label: "NENHUM PROBLEMA, TUDO CERTO!", imagem: "images/ok.png" }

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
let tempoQRCode = 60;
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
    
    // Se tiver ícones, usa label como valor
    const valor = pergunta.comIcones ? opcao.label : opcao;
    input.value = valor;
    input.onchange = () => responderCategoria(valor);

    label.appendChild(input);
    
    if (pergunta.comIcones) {
      // Criar container com ícone + texto
      const container = document.createElement("div");
      container.className = "categoria-item";
      
      const img = document.createElement("img");
      img.src = opcao.icone;
      img.alt = opcao.label;
      
      const texto = document.createElement("span");
      texto.textContent = opcao.label;
      
      container.appendChild(img);
      container.appendChild(texto);
      label.appendChild(container);
    } else {
      label.appendChild(document.createTextNode(opcao));
    }
    
    opcoesCategorias.appendChild(label);
  });

  telaCategorias.classList.remove("hidden");
}

/* =========================
   RESPONDER
========================= */
function responderNPS(valor) {
  if (bloqueado) return;
  bloqueado = true;

  const perguntaAtual = perguntas[indice];
  respostas[perguntaAtual.id] = valor;

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

  /*tempoQRCode = 8;*/
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
    dados.append(p.id, respostas[p.id] !== undefined ? respostas[p.id] : "");
  });

  fetch(URL_APPS_SCRIPT, {
    method: "POST",
    body: dados,
    mode: "no-cors"
  }).catch(() => salvarOffline(dados.toString()));
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
  tempoQRCode = 60;

  if (intervaloQRCode) clearInterval(intervaloQRCode);

  mostrarPergunta();
}

/* ===== BLOQUEAR ZOOM ===== */
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Bloquear Ctrl + scroll
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

// Bloquear Ctrl + +/- 
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
    e.preventDefault();
  }
});

