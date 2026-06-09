// ── Digitação — standalone game ──────────────────────────────

const DIG_ALUNOS_KEY = 'professorlusca_alunos';

function voltarPlataforma() {
  window.location.href = '../../index.html';
}

function lerAlunoId() {
  return new URLSearchParams(window.location.search).get('alunoId') || '';
}

function _digGetAlunos() {
  try { return JSON.parse(localStorage.getItem(DIG_ALUNOS_KEY) || '[]'); } catch(e) { return []; }
}

function _digSalvarAluno(aluno) {
  if (!aluno) return;
  const todos = _digGetAlunos();
  const idx = todos.findIndex(a => a.id === aluno.id);
  if (idx >= 0) todos[idx] = aluno; else todos.push(aluno);
  localStorage.setItem(DIG_ALUNOS_KEY, JSON.stringify(todos));
  // sincroniza com o servidor (mesmo endpoint do index.html)
  _digSyncPush(aluno);
}

async function _digSyncPush(aluno) {
  try {
    const url = localStorage.getItem('professorlusca_sync_url');
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'save', aluno })
    });
  } catch(e) {}
}

function _digSalvarPontos(pts) {
  if (!alunoAtivo || !pts || pts <= 0) return;
  alunoAtivo.progresso = alunoAtivo.progresso || {};
  alunoAtivo.progresso.pontosJogos = (alunoAtivo.progresso.pontosJogos || 0) + pts;
  _digSalvarAluno(alunoAtivo);
  const prev = (() => { try { return JSON.parse(localStorage.getItem('lusca_pending_game_result') || 'null'); } catch(e) { return null; } })();
  const prevScore = (prev && prev.gameId === 'digitacao') ? (prev.score || 0) : 0;
  localStorage.setItem('lusca_pending_game_result', JSON.stringify({
    alunoId: alunoAtivo.id,
    gameId: 'digitacao',
    moduloId: new URLSearchParams(window.location.search).get('moduloId') || 'digitacao',
    status: 'completed',
    score: prevScore + pts,
    timestamp: new Date().toISOString()
  }));
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function mostrarTela(id) {
  document.querySelectorAll('.dig-screen').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) { el.style.display = 'block'; el.scrollTop = 0; }
}

// Load active student from URL param
const _alunoId = lerAlunoId();
let alunoAtivo = _digGetAlunos().find(a => a.id === _alunoId) || null;

const TEXTOS_DIGITACAO = {
  facil: [
    "O mouse e o teclado sao hardware. O Chrome e software.",
    "Eu uso o computador para estudar e jogar todo dia.",
    "Hardware e a parte fisica. Software e a parte digital.",
    "O Windows e um sistema operacional muito usado no mundo.",
    "Sem internet a gente nao consegue ver YouTube ou TikTok.",
    "A CPU e o cerebro do computador. Ela processa todas as informacoes.",
    "O HD guarda arquivos. A RAM e a memoria rapida e temporaria.",
    "Monitor e hardware de saida. Teclado e hardware de entrada.",
    "Para digitar rapido, mantenha os dedos na posicao inicial.\nOs indicadores ficam no F e no J. Tente nao olhar o teclado.",
    "A internet conecta computadores do mundo inteiro.\nSem ela nao teria redes sociais nem streaming de videos.",
    "O notebook e um computador portatil que funciona com bateria.\nEle e pratico para carregar para a escola ou trabalho.",
    "Uma senha forte tem letras, numeros e simbolos misturados.\nNunca use sua data de nascimento ou nome como senha.",
    "O SSD e muito mais rapido que o HD antigo.\nEle nao tem peca mecanica, por isso e mais duravel.",
    "A RAM guarda os programas abertos no momento.\nQuando voce reinicia o PC, tudo que estava nela e apagado.",
    "O teclado tem letras, numeros e teclas especiais.\nAprender a posicao dos dedos ajuda a digitar mais rapido."
  ],
  medio: [
    "O computador e uma maquina que ajuda a trabalhar, jogar e aprender. Por dentro ele tem muitas pecas que funcionam juntas.",
    "Hardware sao as partes que voce pode tocar: o monitor, o teclado, o mouse. Software sao os programas que rodam no computador.",
    "Um navegador como o Chrome ou o Firefox e o programa que abre sites. Sem ele voce nao consegue acessar o Google ou o YouTube.",
    "O antivirus protege o computador contra virus e programas ruins. Nunca clique em links estranhos ou baixe arquivos de sites duvidosos.",
    "Para digitar rapido, e importante usar os dois polegares para a barra de espaco e nao olhar para o teclado enquanto escreve.",
    "A memoria cache e um tipo especial de memoria muito rapida.\nFica dentro do processador para guardar dados frequentemente usados.\nQuanto maior a cache, mais agil fica o desempenho geral.",
    "O sistema operacional gerencia a comunicacao entre hardware e software.\nSem ele, os programas nao conseguiriam funcionar corretamente.\nWindows, Linux e macOS sao os sistemas mais populares do mundo.",
    "As linguagens de programacao sao como idiomas para o computador.\nCada uma tem sua sintaxe e seus casos de uso especificos.\nPython e facil de aprender. JavaScript roda direto nos navegadores.",
    "O firewall e um sistema de seguranca que monitora o trafego de rede.\nEle bloqueia conexoes suspeitas e protege seus dados pessoais.\nPode ser um programa instalado ou um dispositivo fisico dedicado.",
    "Computacao em nuvem permite acessar arquivos de qualquer dispositivo.\nNao precisa de HD grande se tudo fica em servidores remotos seguros.\nGoogle Drive, Dropbox e OneDrive sao exemplos bastante populares.",
    "O processador trabalha em ciclos por segundo, medidos em gigahertz.\nQuanto maior a frequencia, mais calculos ele consegue fazer por segundo.\nTer mais nucleos tambem aumenta muito o desempenho em tarefas paralelas.",
    "Resolucao de tela e medida em pixels por polegada, chamada de PPI.\nQuanto mais pixels, mais nitida e detalhada e a imagem na tela.\nTelas 4K tem quatro vezes mais pixels do que as telas Full HD.",
    "A placa de video, ou GPU, e responsavel pelo processamento de imagens.\nEla e essencial para jogos, edicao de video e design grafico profissional.\nGPUs modernas tambem sao usadas para treinar modelos de inteligencia artificial.",
    "Backup e a copia de seguranca dos seus arquivos importantes.\nArmazene seus dados em um HD externo ou na nuvem regularmente.\nAssim voce nao perde nada em caso de virus, roubo ou defeito.",
    "Phishing e um golpe em que criminosos enviam mensagens falsas.\nElas imitam bancos ou lojas para roubar senhas e dados pessoais.\nSempre verifique o endereco do site antes de digitar qualquer informacao."
  ],
  dificil: [
    "Um sistema operacional como Windows ou Linux gerencia todo o hardware e permite que aplicativos como Word, Photoshop e navegadores funcionem corretamente em harmonia.",
    "A diferenca essencial entre hardware e software esta na sua natureza: o primeiro e fisico e tangivel, enquanto o segundo e abstrato, formado por instrucoes que controlam o comportamento da maquina.",
    "Phishing e uma tecnica de engenharia social na qual criminosos enviam emails falsos imitando empresas conhecidas para roubar senhas, dados bancarios e informacoes pessoais dos usuarios.",
    "A memoria RAM e volatil e funciona como espaco temporario para o processador acessar dados em uso. Quando o computador desliga, todo conteudo e perdido instantaneamente.",
    "Navegadores modernos como Chrome, Edge e Firefox utilizam motores de renderizacao distintos para interpretar HTML, CSS e JavaScript, afetando velocidade e compatibilidade com padroes web.",
    "O protocolo TCP/IP e a base de comunicacao da internet moderna.\nO TCP garante que os pacotes de dados cheguem corretamente ao destino, retransmitindo os que forem perdidos.\nO IP define o esquema de enderecamento unico de cada dispositivo conectado a rede global.",
    "Criptografia assimetrica utiliza um par de chaves matematicamente relacionadas: publica e privada.\nA chave publica criptografa os dados e pode ser compartilhada com qualquer pessoa livremente.\nSomente a chave privada correspondente e capaz de descriptografar a mensagem com seguranca.",
    "Algoritmos de machine learning se dividem em categorias com abordagens bem distintas.\nNo aprendizado supervisionado, o modelo treina com dados rotulados e aprende a reconhecer padroes.\nNo nao-supervisionado, ele descobre estruturas ocultas nos dados sem qualquer rotulo pre-definido.",
    "A virtualizacao permite executar multiplos sistemas operacionais em uma unica maquina fisica.\nO hypervisor gerencia os recursos de hardware e isola cada maquina virtual das demais.\nAmazon EC2 e Google Compute Engine sao servicos de nuvem baseados diretamente nesse principio.",
    "Estruturas de dados como listas, filas, pilhas e arvores sao fundamentais em programacao.\nCada estrutura possui caracteristicas proprias de insercao, remocao e busca de elementos.\nEscolher a estrutura adequada e decisivo para garantir a eficiencia do algoritmo desenvolvido.",
    "O conceito de DevOps integra desenvolvimento e operacoes de software em um ciclo continuo de melhoria.\nPraticas como integracao continua e entrega continua automatizam os processos de teste e deploy.\nIsso reduz erros humanos, acelera as entregas e aumenta a confiabilidade geral dos sistemas.",
    "Redes neurais convolucionais sao especializadas no processamento e analise de imagens digitais.\nCamadas de convolucao extraem caracteristicas hierarquicas como bordas, formas e texturas.\nElas formam a base dos sistemas modernos de reconhecimento facial e classificacao de objetos.",
    "O conceito de complexidade de algoritmos e medido pela notacao Big-O, que descreve crescimento.\nUm algoritmo O(n) tem tempo linear, enquanto O(n²) cresce quadraticamente com a entrada.\nEscolher o algoritmo certo pode fazer a diferenca entre segundos e horas de processamento.",
    "Containers Docker encapsulam aplicacoes com todas as suas dependencias em um ambiente isolado.\nIsso garante que o software rode de forma identica em qualquer maquina ou servidor de producao.\nOrquestradores como Kubernetes gerenciam dezenas ou centenas de containers em clusters distribuidos.",
    "O modelo OSI divide a comunicacao em redes em sete camadas com funcoes bem definidas.\nCada camada interage apenas com a camada imediatamente acima ou abaixo na hierarquia.\nEssa abstracao facilita o desenvolvimento de protocolos e a resolucao de problemas em redes complexas."
  ]
};

// Mapa de cada caractere pro dedo correto (1-5, ambas mãos espelhadas)
const FINGER_MAP = {
  // dedo 1 (mindinho)
  'q':1,'a':1,'z':1,'p':1,'l':1,'\\':1,
  // dedo 2 (anelar)
  'w':2,'s':2,'x':2,'o':2,'k':2,
  // dedo 3 (médio)
  'e':3,'d':3,'c':3,'i':3,
  // dedo 4 (indicador)
  'r':4,'f':4,'v':4,'t':4,'g':4,'b':4,'y':4,'h':4,'n':4,'u':4,'j':4,'m':4,
  // polegar
  ' ':5
};

// =============================================================
// MMR — Sistema de Ranking Oculto
// =============================================================
const RANK_TIERS = [
  { nome: 'Aprendiz',             emoji: '🌱', cor: '#94A3B8', mmrMin: 0    },
  { nome: 'Explorador',           emoji: '🔍', cor: '#10B981', mmrMin: 900  },
  { nome: 'Técnico',              emoji: '⚙️',  cor: '#3B82F6', mmrMin: 1050 },
  { nome: 'Especialista',         emoji: '💡', cor: '#8B5CF6', mmrMin: 1200 },
  { nome: 'Hacker do Bem',        emoji: '🖥️',  cor: '#F59E0B', mmrMin: 1350 },
  { nome: 'Mestre Digital',       emoji: '🏅', cor: '#EF4444', mmrMin: 1500 },
  { nome: 'Lenda da Informática', emoji: '🏆', cor: '#EC4899', mmrMin: 1700 },
];
// MMR implícito de cada dificuldade (o "oponente")
const DIF_MMR = { facil: 900, medio: 1075, dificil: 1250 };

function _digGetRanking() {
  if (!alunoAtivo) return { mmr:1000, lp:0, tier:0, partidas:0, vitorias:0, derrotas:0, sequencia:0 };
  const r = alunoAtivo.progresso?.ranking;
  if (r) return r;
  return { mmr:1000, lp:0, tier:0, partidas:0, vitorias:0, derrotas:0, sequencia:0 };
}

function _digSalvarRanking(r) {
  if (!alunoAtivo) return;
  alunoAtivo.progresso = alunoAtivo.progresso || {};
  alunoAtivo.progresso.ranking = r;
  _digSalvarAluno(alunoAtivo);
}

function _digTierFromMMR(mmr) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (mmr >= RANK_TIERS[i].mmrMin) return i;
  }
  return 0;
}

// Dificuldade recomendada com base no MMR atual
function _digDifRecomendada(mmr) {
  if (mmr < 1030) return 'facil';
  if (mmr < 1200) return 'medio';
  return 'dificil';
}

// resultado: 1=vitória, 0.5=empate, 0=derrota
function _digResultadoMMR(wpm, precisao, completou) {
  const velNorm = Math.min(1, wpm / 40); // 40 WPM = velocidade máxima
  const score = (precisao / 100) * 0.6 + velNorm * 0.3 + (completou ? 0.1 : 0);
  if (score >= 0.82) return 1;
  if (score >= 0.60) return 0.5;
  return 0;
}

function _digAtualizarMMR(wpm, precisao, completou, dif) {
  const ranking = _digGetRanking();
  const difMMR  = DIF_MMR[dif] || 1000;
  const K       = ranking.partidas < 10 ? 32 : ranking.partidas < 30 ? 24 : 16;

  const chance    = 1 / (1 + Math.pow(10, (difMMR - ranking.mmr) / 400));
  const resultado = _digResultadoMMR(wpm, precisao, completou);
  const deltaMmr  = Math.round(K * (resultado - chance));
  const novoMMR   = Math.max(200, ranking.mmr + deltaMmr);

  // LP: base + bônus/penalidade conforme MMR vs rank visível
  const tierMMRMin = RANK_TIERS[ranking.tier]?.mmrMin || 0;
  const mmrAdv     = novoMMR - tierMMRMin;
  const lpMult     = mmrAdv > 150 ? 1.35 : mmrAdv < -100 ? 0.65 : 1.0;
  const lpBase     = resultado === 1 ? 22 : resultado === 0.5 ? 5 : -18;
  const lpDelta    = Math.round(lpBase * lpMult);

  let novoLP   = ranking.lp + lpDelta;
  let novoTier = ranking.tier;

  if (novoLP >= 100) {
    novoLP -= 100;
    novoTier = Math.min(RANK_TIERS.length - 1, novoTier + 1);
  }
  if (novoLP < 0 && novoTier > 0) {
    novoTier--;
    novoLP = Math.max(10, 75 + novoLP); // pouso suave
  }
  if (novoLP < 0) novoLP = 0;

  const novoRanking = {
    mmr:       novoMMR,
    lp:        novoLP,
    tier:      novoTier,
    partidas:  ranking.partidas + 1,
    vitorias:  ranking.vitorias + (resultado === 1 ? 1 : 0),
    derrotas:  ranking.derrotas + (resultado === 0 ? 1 : 0),
    sequencia: resultado === 1 ? (ranking.sequencia + 1) : 0,
  };
  _digSalvarRanking(novoRanking);
  return { novoRanking, deltaMmr, lpDelta, resultado };
}

function _digRankBadgeHtml(ranking, pequeno) {
  const tier = RANK_TIERS[ranking.tier] || RANK_TIERS[0];
  if (pequeno) {
    return `<span style="display:inline-flex;align-items:center;gap:5px;background:${tier.cor}22;border:1.5px solid ${tier.cor};border-radius:20px;padding:3px 10px;font-size:12px;font-weight:700;color:${tier.cor};">
      ${tier.emoji} ${tier.nome} · ${ranking.lp} LP
    </span>`;
  }
  return `<div style="display:inline-flex;align-items:center;gap:10px;background:${tier.cor}22;border:2px solid ${tier.cor};border-radius:16px;padding:10px 18px;">
    <span style="font-size:32px;">${tier.emoji}</span>
    <div>
      <div style="font-size:18px;font-weight:800;color:${tier.cor};">${tier.nome}</div>
      <div style="font-size:12px;color:var(--ink-soft);">${ranking.lp} LP · ${ranking.partidas} partidas · MMR ${ranking.mmr}</div>
      <div style="margin-top:4px;height:6px;background:var(--bg-soft);border-radius:3px;overflow:hidden;">
        <div style="height:100%;width:${ranking.lp}%;background:${tier.cor};border-radius:3px;transition:width 0.5s;"></div>
      </div>
    </div>
  </div>`;
}

let digState = {
  modo: 'treino',
  dif: 'facil',
  texto: '',
  pos: 0,
  erros: 0,
  caracteresErrados: 0,
  inicio: 0,
  timerId: null,
  countdownId: null,
  finalizado: false,
  tempoRestante: 0,
  tempoTotal: 0,
  penalidade: 5
};


function abrirMenuDigitacao() {
  // ajusta dificuldade recomendada conforme MMR do aluno
  const ranking = _digGetRanking();
  const difRec = _digDifRecomendada(ranking.mmr);
  digState.dif = difRec;

  document.querySelectorAll('#digNivelSelector .dig-nivel-btn').forEach(b => b.classList.remove('active'));
  const map = {facil:0, medio:1, dificil:2};
  const btns = document.querySelectorAll('#digNivelSelector .dig-nivel-btn');
  if (btns[map[difRec]]) btns[map[difRec]].classList.add('active');

  // mostra badge de rank no menu
  const badgeContainer = document.getElementById('digRankBadge');
  if (badgeContainer && alunoAtivo) {
    badgeContainer.innerHTML = _digRankBadgeHtml(ranking, false);
    badgeContainer.style.display = 'flex';
    badgeContainer.style.justifyContent = 'center';
    badgeContainer.style.marginBottom = '16px';
  }

  renderHistoricoDigitacao();
  mostrarTela('screen-digitacao-menu');
}

function setDifDig(d, el) {
  digState.dif = d;
  document.querySelectorAll('#digNivelSelector .dig-nivel-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function iniciarDigitacao(modo) {
  digState.modo = modo;
  // no ranqueado, dificuldade é definida pelo MMR do aluno
  if (modo === 'ranqueado') {
    digState.dif = _digDifRecomendada(_digGetRanking().mmr);
  }
  // sorteia texto da dificuldade
  const textos = TEXTOS_DIGITACAO[digState.dif];
  digState.texto = textos[Math.floor(Math.random() * textos.length)];
  digState.pos = 0;
  digState.erros = 0;
  digState.caracteresErrados = 0;
  digState.inicio = 0;
  digState.finalizado = false;
  if (digState.timerId) clearInterval(digState.timerId);
  if (digState.countdownId) clearInterval(digState.countdownId);
  digState.countdownId = null;

  if (modo === 'ranqueado') {
    const tempos = {facil: 90, medio: 75, dificil: 60};
    const penalidades = {facil: 3, medio: 5, dificil: 8};
    digState.tempoTotal = tempos[digState.dif] || 90;
    digState.tempoRestante = digState.tempoTotal;
    digState.penalidade = penalidades[digState.dif] || 5;
  }

  document.getElementById('digTopTitle').textContent =
    (modo === 'ranqueado' ? '🏆 Ranqueado' : '🧘 Treino') + ' — ' +
    (digState.dif === 'facil' ? '🟢 Fácil' : digState.dif === 'medio' ? '🟡 Médio' : '🔴 Difícil');
  document.getElementById('digResultado').innerHTML = '';

  renderTextoDigitacao();
  renderTecladoVirtual();
  atualizarStatsDigitacao();
  mostrarTela('screen-digitacao');

  // ouvinte do teclado
  document.addEventListener('keydown', listenerDigitacao);
}

function renderTextoDigitacao() {
  const html = digState.texto.split('').map((c, i) => {
    let cls = 'dig-char';
    if (c === ' ') cls += ' space';
    if (c === '\n') cls += ' newline';
    if (i < digState.pos) cls += ' done';
    else if (i === digState.pos) cls += ' current';
    let display;
    if (c === ' ') display = ' ';
    else if (c === '\n') display = '↵<br>';
    else display = escapeHtml(c);
    return `<span class="${cls}" data-i="${i}">${display}</span>`;
  }).join('');
  const box = document.getElementById('digTextoBox');
  box.innerHTML = html;
  // auto-scroll para manter o cursor visível no centro
  const cur = box.querySelector('.dig-char.current');
  if (cur) box.scrollTop = cur.offsetTop - box.clientHeight / 2 + cur.offsetHeight / 2;
  // atualizar barra de progresso visual
  const pct = digState.texto.length > 0 ? Math.round(digState.pos / digState.texto.length * 100) : 0;
  const bar = document.getElementById('digProgressoBar');
  const pctEl = document.getElementById('digProgressoPct');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

function renderTecladoVirtual() {
  // Layout simplificado em PT-BR
  const linhas = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ç'],
    ['Z','X','C','V','B','N','M']
  ];
  let html = '';
  linhas.forEach((linha, li) => {
    html += '<div class="teclado-linha">';
    if (li === 1) html += '<div class="tecla wide-1.5">Caps</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    linha.forEach(letra => {
      const finger = FINGER_MAP[letra.toLowerCase()] || '';
      html += `<div class="tecla" data-tecla="${letra.toLowerCase()}" data-finger="${finger}">${letra}</div>`;
    });
    if (li === 1) html += '<div class="tecla wide-1.5">Enter</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    html += '</div>';
  });
  // barra de espaço
  html += '<div class="teclado-linha"><div class="tecla wide-3" data-tecla=" " data-finger="5">Espaço</div></div>';
  document.getElementById('tecladoVirtual').innerHTML = html;
  destacarProximaTecla();
}

function destacarProximaTecla() {
  document.querySelectorAll('.tecla').forEach(t => t.classList.remove('next'));
  if (digState.pos >= digState.texto.length) return;
  const proxChar = digState.texto[digState.pos].toLowerCase();
  document.querySelectorAll(`.tecla[data-tecla="${proxChar}"]`).forEach(t => t.classList.add('next'));
}

function flashTecla(char) {
  const t = document.querySelector(`.tecla[data-tecla="${char.toLowerCase()}"]`);
  if (!t) return;
  t.classList.add('pressed');
  setTimeout(() => t.classList.remove('pressed'), 120);
}

function listenerDigitacao(e) {
  if (digState.finalizado) return;
  if (e.key === 'Escape') { sairDigitacao(); return; }
  const isEnter = e.key === 'Enter';
  if (e.key.length !== 1 && !isEnter) return; // ignora setas, F1, etc

  if (digState.pos === 0 && !digState.inicio && digState.modo === 'ranqueado') {
    digState.inicio = Date.now();
    digState.timerId = setInterval(atualizarStatsDigitacao, 250);
    digState.countdownId = setInterval(() => {
      if (digState.finalizado) return;
      digState.tempoRestante--;
      if (digState.tempoRestante <= 0) { digState.tempoRestante = 0; falharDigitacao(); }
      atualizarStatsDigitacao();
    }, 1000);
  }
  if (digState.pos === 0 && !digState.inicio && digState.modo === 'treino') {
    digState.inicio = Date.now();
  }

  const esperado = digState.texto[digState.pos];
  const digitado = isEnter ? '\n' : e.key;
  flashTecla(digitado);

  const certo = normalizarChar(esperado) === normalizarChar(digitado);

  if (certo) {
    // marca como done
    const spans = document.querySelectorAll('#digTextoBox .dig-char');
    if (spans[digState.pos]) {
      spans[digState.pos].classList.remove('current', 'wrong');
      spans[digState.pos].classList.add('done');
    }
    digState.pos++;
    if (digState.pos >= digState.texto.length) {
      finalizarDigitacao();
      return;
    }
    if (spans[digState.pos]) {
      spans[digState.pos].classList.add('current');
    }
    destacarProximaTecla();
  } else {
    digState.erros++;
    digState.caracteresErrados++;
    const spans = document.querySelectorAll('#digTextoBox .dig-char');
    if (spans[digState.pos]) {
      spans[digState.pos].classList.add('wrong');
      setTimeout(() => spans[digState.pos]?.classList.remove('wrong'), 400);
    }
    if (digState.modo === 'ranqueado' && digState.inicio) {
      digState.tempoRestante = Math.max(0, digState.tempoRestante - digState.penalidade);
      if (digState.tempoRestante <= 0) { falharDigitacao(); return; }
    }
  }
  atualizarStatsDigitacao();
}

function falharDigitacao() {
  if (digState.finalizado) return;
  digState.finalizado = true;
  if (digState.timerId) clearInterval(digState.timerId);
  if (digState.countdownId) clearInterval(digState.countdownId);
  document.removeEventListener('keydown', listenerDigitacao);
  document.getElementById('digResultado').innerHTML = `
    <div class="dig-completo" style="background:linear-gradient(135deg,#EF4444,#B91C1C);">
      <div style="font-size:64px; margin-bottom:8px;">⏱️</div>
      <div style="font-size:28px; font-weight:800; margin-bottom:8px;">Tempo esgotado!</div>
      <div style="font-size:16px; opacity:0.9; margin-bottom:16px;">
        Chegou em ${Math.round(digState.pos/digState.texto.length*100)}% do texto · ${digState.erros} erros
      </div>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:20px;">
        <button class="btn ghost" style="background:white;color:#EF4444;" onclick="iniciarDigitacao('ranqueado')">↻ Tentar de novo</button>
        <button class="btn" style="background:white;color:var(--ink);" onclick="abrirMenuDigitacao()">Mudar modo</button>
      </div>
    </div>`;
}

function normalizarChar(c) {
  return c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function atualizarStatsDigitacao() {
  const tempoEl = document.getElementById('digTempo');
  if (digState.modo === 'ranqueado') {
    const t = digState.tempoRestante;
    tempoEl.textContent = t + 's';
    tempoEl.style.color = t <= 15 ? '#EF4444' : t <= 30 ? '#FBBF24' : '';
  } else {
    const tempoMs = digState.inicio ? (Date.now() - digState.inicio) : 0;
    tempoEl.textContent = Math.floor(tempoMs / 1000) + 's';
    tempoEl.style.color = '';
  }

  const palavras = digState.pos / 5; // padrão WPM = 5 chars = 1 palavra
  const tempoSeg = digState.inicio ? (Date.now() - digState.inicio) / 1000 : 0;
  const wpm = tempoSeg > 0 ? Math.round((palavras / tempoSeg) * 60) : 0;
  document.getElementById('digWpm').textContent = wpm;

  const totalDigitado = digState.pos + digState.caracteresErrados;
  const precisao = totalDigitado > 0 ? Math.round((digState.pos / totalDigitado) * 100) : 100;
  document.getElementById('digPrecisao').textContent = precisao + '%';

  document.getElementById('digErros').textContent = digState.erros;
  document.getElementById('digProgresso').textContent =
    Math.round((digState.pos / digState.texto.length) * 100) + '%';
}

function setNivelEIniciar(dif) {
  digState.dif = dif;
  document.querySelectorAll('#digNivelSelector .dig-nivel-btn').forEach(b => b.classList.remove('active'));
  const map = {facil:0, medio:1, dificil:2};
  const btns = document.querySelectorAll('#digNivelSelector .dig-nivel-btn');
  if (btns[map[dif]]) btns[map[dif]].classList.add('active');
  iniciarDigitacao(digState.modo);
}

function finalizarDigitacao() {
  digState.finalizado = true;
  if (digState.timerId) clearInterval(digState.timerId);
  if (digState.countdownId) clearInterval(digState.countdownId);
  document.removeEventListener('keydown', listenerDigitacao);

  const tempoSeg = (Date.now() - digState.inicio) / 1000;
  const palavras = digState.texto.length / 5;
  const wpm = Math.round((palavras / tempoSeg) * 60);
  const totalDigitado = digState.texto.length + digState.caracteresErrados;
  const precisao = Math.round((digState.texto.length / totalDigitado) * 100);

  // Calcula pontos (só ranqueado)
  let pontos = 0;
  let mmrHtml = '';

  if (digState.modo === 'ranqueado') {
    const baseDif = {facil: 1, medio: 1.5, dificil: 2}[digState.dif] || 1;
    pontos = Math.round((wpm + precisao - 50) * baseDif);
    pontos = Math.max(5, pontos);
    _digSalvarPontos(pontos);

    // atualiza MMR
    const mmrRes = _digAtualizarMMR(wpm, precisao, true, digState.dif);
    const { novoRanking, deltaMmr, lpDelta, resultado } = mmrRes;
    const tier = RANK_TIERS[novoRanking.tier];
    const resultadoLabel = resultado === 1 ? '🏅 Vitória' : resultado === 0.5 ? '🤝 Empate técnico' : '💀 Derrota';
    const lpSinal = lpDelta >= 0 ? `+${lpDelta}` : `${lpDelta}`;
    const mmrSinal = deltaMmr >= 0 ? `+${deltaMmr}` : `${deltaMmr}`;
    const lpColor = lpDelta >= 0 ? '#10B981' : '#EF4444';

    mmrHtml = `
      <div style="background:rgba(0,0,0,0.25);border-radius:14px;padding:14px 18px;margin:12px 0;text-align:center;">
        <div style="font-size:13px;font-weight:700;opacity:0.8;margin-bottom:6px;">${resultadoLabel} RANQUEADA</div>
        <div style="display:flex;justify-content:center;gap:20px;align-items:center;flex-wrap:wrap;">
          <div>
            <div style="font-size:22px;font-weight:900;color:${lpColor};">${lpSinal} LP</div>
            <div style="font-size:10px;opacity:0.7;">LIGA</div>
          </div>
          <div style="font-size:20px;opacity:0.4;">|</div>
          <div>
            <div style="font-size:16px;font-weight:700;opacity:0.85;">${mmrSinal} MMR</div>
            <div style="font-size:10px;opacity:0.7;">OCULTO</div>
          </div>
          <div style="font-size:20px;opacity:0.4;">|</div>
          <div>
            ${_digRankBadgeHtml(novoRanking, true)}
            <div style="font-size:10px;opacity:0.7;margin-top:2px;text-align:center;">${novoRanking.lp}/100 LP</div>
          </div>
        </div>
        <div style="margin-top:10px;height:6px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${novoRanking.lp}%;background:${tier?.cor || '#10B981'};border-radius:3px;transition:width 0.8s;"></div>
        </div>
      </div>`;

    // salva histórico
    if (!alunoAtivo.progresso.digitacao) alunoAtivo.progresso.digitacao = [];
    alunoAtivo.progresso.digitacao.unshift({
      modo: digState.modo,
      dif: digState.dif,
      wpm, precisao, tempo: Math.floor(tempoSeg), erros: digState.erros, pontos,
      data: new Date().toISOString()
    });
    if (alunoAtivo.progresso.digitacao.length > 20) {
      alunoAtivo.progresso.digitacao = alunoAtivo.progresso.digitacao.slice(0, 20);
    }
    _digSalvarAluno(alunoAtivo);
  }

  let conceito = '';
  if (wpm >= 50) conceito = '🚀 Fera!';
  else if (wpm >= 35) conceito = '⚡ Rápido!';
  else if (wpm >= 20) conceito = '👍 Bom ritmo!';
  else conceito = '💪 Continua treinando!';

  document.getElementById('digResultado').innerHTML = `
    <div class="dig-completo">
      <div style="font-size:64px; margin-bottom:8px;">${digState.modo === 'ranqueado' ? '🏆' : '🎉'}</div>
      <div style="font-size:28px; font-weight:800; margin-bottom:8px;">Concluído! ${conceito}</div>
      <div style="font-size:16px; opacity:0.9; margin-bottom:16px;">
        ${wpm} palavras/min · ${precisao}% precisão · ${Math.floor(tempoSeg)}s · ${digState.erros} erros
      </div>
      ${digState.modo === 'ranqueado' ? `<div style="font-size:28px; font-weight:900;">+${pontos} ⭐</div>` : ''}
      ${mmrHtml}
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin-top:20px;">
        <button class="btn ghost" style="background:white;color:var(--green);" onclick="iniciarDigitacao('${digState.modo}')">↻ Novo texto</button>
        <button class="btn" style="background:white;color:var(--ink);" onclick="abrirMenuDigitacao()">Mudar modo</button>
        <button class="btn" style="background:rgba(0,0,0,0.2);color:white;" onclick="voltarPlataforma()">Menu</button>
      </div>
    </div>`;
}

function sairDigitacao() {
  if (digState.timerId) clearInterval(digState.timerId);
  if (digState.countdownId) clearInterval(digState.countdownId);
  document.removeEventListener('keydown', listenerDigitacao);
  abrirMenuDigitacao();
}

function renderHistoricoDigitacao() {
  const container = document.getElementById('digHistorico');
  if (!container || !alunoAtivo) return;

  // Ranking por MMR oculto
  const alunos = _digGetAlunos();
  const rankingMMR = [];
  alunos.forEach(a => {
    const r = a.progresso?.ranking;
    if (r && r.partidas > 0) {
      rankingMMR.push({ nome: a.nome, id: a.id, mmr: r.mmr, lp: r.lp, tier: r.tier, partidas: r.partidas });
    }
  });
  rankingMMR.sort((a, b) => b.mmr - a.mmr || b.lp - a.lp);

  let html = '';
  if (rankingMMR.length > 0) {
    html += `<div class="section-titulo"><iconify-icon icon="ph:trophy-bold"></iconify-icon> RANKING RANQUEADO</div>
    <div class="dig-ranking-table">
      <table>
        <thead><tr><th>POS</th><th>ALUNO</th><th>RANK</th><th>LP</th><th>MMR</th><th>PARTIDAS</th></tr></thead>
        <tbody>
          ${rankingMMR.map((r, i) => {
            const tier = RANK_TIERS[r.tier] || RANK_TIERS[0];
            return `<tr class="${r.id === alunoAtivo.id ? 'me' : ''}">
              <td>${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + 'º'}</td>
              <td>${escapeHtml(r.nome)}${r.id === alunoAtivo.id ? ' (você)' : ''}</td>
              <td style="color:${tier.cor};font-weight:700;">${tier.emoji} ${tier.nome}</td>
              <td>${r.lp}</td>
              <td style="font-size:11px;opacity:0.7;">${r.mmr}</td>
              <td>${r.partidas}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  // Histórico pessoal do aluno
  const hist = (alunoAtivo.progresso?.digitacao || []).slice(0, 5);
  if (hist.length > 0) {
    html += `<div class="section-titulo" style="margin-top:24px;"><iconify-icon icon="ph:chart-bar-bold"></iconify-icon> SEUS ÚLTIMOS 5 RESULTADOS</div>
    <div class="dig-ranking-table">
      <table>
        <thead><tr><th>QUANDO</th><th>WPM</th><th>PRECISÃO</th><th>NÍVEL</th><th>PONTOS</th></tr></thead>
        <tbody>
          ${hist.map(h => {
            const d = new Date(h.data);
            const data = d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}) + ' ' +
                         d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
            return `<tr>
              <td>${data}</td>
              <td><strong>${h.wpm}</strong></td>
              <td>${h.precisao}%</td>
              <td>${h.dif === 'facil' ? '🟢' : h.dif === 'medio' ? '🟡' : '🔴'}</td>
              <td>+${h.pontos} ⭐</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  if (!html) {
    html = '<div style="text-align:center; color:var(--ink-soft); padding:20px;">Ainda não tem rankings. Faz um modo ranqueado pra aparecer aqui!</div>';
  }

  container.innerHTML = html;
}

// =============================================================
// FILEIRAS — Sistema de Lições por Fileira do Teclado
// =============================================================

const FILEIRAS = [
  {
    id: 'meio',
    nome: 'Fileira do Meio',
    apelido: 'Home Row',
    cor: 'meio',
    icon: '🏠',
    teclas: 'A S D F J K L Ç',
    teclasList: ['a','s','d','f','j','k','l','ç'],
    descricao: 'A fileira mais importante! Seus dedos sempre voltam pra cá.',
    licoes: [
      {
        id: 'm1', num: 1, tipo: 'INTRO', titulo: 'Teclas J e F',
        teclas: ['j','f'],
        instrucao: 'As teclas <strong>F</strong> e <strong>J</strong> têm uma saliência pra você encontrar sem olhar! Dedo indicador esquerdo no F, indicador direito no J.',
        dica: '👆 Indicador esquerdo = F · Indicador direito = J',
        texto: 'j f j f j f f j j f f j j f f j f j j f j f f j j f f j f j'
      },
      {
        id: 'm2', num: 2, tipo: 'TREINO', titulo: 'Adicionar D e K',
        teclas: ['f','j','d','k'],
        instrucao: 'Agora adicione <strong>D</strong> (dedo médio esquerdo) e <strong>K</strong> (dedo médio direito).',
        dica: '🖕 Médio esquerdo = D · Médio direito = K',
        texto: 'dk fd kj fk dj kf jd df kd fj dk fd fk jd dk fj jk df kd fj'
      },
      {
        id: 'm3', num: 3, tipo: 'TREINO', titulo: 'Adicionar S e L',
        teclas: ['f','j','d','k','s','l'],
        instrucao: 'Adicione <strong>S</strong> (anelar esquerdo) e <strong>L</strong> (anelar direito).',
        dica: '💍 Anelar esquerdo = S · Anelar direito = L',
        texto: 'sl df jk fs lj sd kf jl ds fk sl jd fs lk dj sf kl jf sd ls'
      },
      {
        id: 'm4', num: 4, tipo: 'TREINO', titulo: 'Adicionar A e Ç',
        teclas: ['a','s','d','f','j','k','l','ç'],
        instrucao: 'Agora a fileira completa! <strong>A</strong> (mindinho esquerdo) e <strong>Ç</strong> (mindinho direito).',
        dica: '🤙 Mindinho esquerdo = A · Mindinho direito = Ç',
        texto: 'as df jk la sa df kj al as fj dk sl ad fk jl sa dk fl ja sd'
      },
      {
        id: 'm5', num: 5, tipo: 'PALAVRAS', titulo: 'Palavras — Home Row',
        teclas: ['a','s','d','f','j','k','l'],
        instrucao: 'Vamos formar palavras! Só usando letras da fileira do meio.',
        dica: '📝 Use apenas A S D F J K L',
        texto: 'sal fal sal dad als fad lad ask jal sal fal dad ask lad als ask'
      },
      {
        id: 'm6', num: 6, tipo: 'VELOCIDADE', titulo: 'Teste de Velocidade',
        teclas: ['a','s','d','f','j','k','l','ç'],
        instrucao: '🏁 Hora de colocar a velocidade à prova! Tente fazer a fileira completa sem erros.',
        dica: '⏱️ Vai com calma, precisão primeiro!',
        texto: 'asdfjkl asdf jkla sdfa jkls fads jklf asdj fkla sdj fkla sdj kfl as'
      }
    ]
  },
  {
    id: 'superior',
    nome: 'Fileira Superior',
    apelido: 'Top Row',
    cor: 'superior',
    icon: '⬆️',
    teclas: 'Q W E R T Y U I O P',
    teclasList: ['q','w','e','r','t','y','u','i','o','p'],
    descricao: 'As letras da fileira de cima. Muitas vogais aqui!',
    licoes: [
      {
        id: 's1', num: 1, tipo: 'INTRO', titulo: 'Teclas R e U',
        teclas: ['r','u'],
        instrucao: '<strong>R</strong> (indicador esquerdo sobe um) e <strong>U</strong> (indicador direito sobe um). Lembre: parta sempre do F e J.',
        dica: '☝️ Indicador esquerdo sobe = R · Indicador direito sobe = U',
        texto: 'ru ur ru ur rr uu ru ur ru ur rr uu ur ru rr uu ru ur ru rr uu'
      },
      {
        id: 's2', num: 2, tipo: 'TREINO', titulo: 'Adicionar E e I',
        teclas: ['r','u','e','i'],
        instrucao: '<strong>E</strong> (médio esquerdo sobe) e <strong>I</strong> (médio direito sobe). Vai devagar!',
        dica: '🖕 Médio esquerdo sobe = E · Médio direito sobe = I',
        texto: 'ei ru ue ir ei ru re ui ei ru ue ir re ui ei ru ue ir re ui ei'
      },
      {
        id: 's3', num: 3, tipo: 'TREINO', titulo: 'Adicionar W e O',
        teclas: ['w','o','e','i','r','u'],
        instrucao: '<strong>W</strong> (anelar esquerdo sobe) e <strong>O</strong> (anelar direito sobe).',
        dica: '💍 Anelar esquerdo sobe = W · Anelar direito sobe = O',
        texto: 'wo re ui ow re ui wo er io wu or we ir ow eu wi ro we ui ow re'
      },
      {
        id: 's4', num: 4, tipo: 'TREINO', titulo: 'Adicionar T e Y',
        teclas: ['t','y','r','u','e','i','w','o'],
        instrucao: '<strong>T</strong> e <strong>Y</strong> — ambas alcançadas pelo dedo indicador, esticando um pouco.',
        dica: '👆 Indicador esquerdo estica = T · Indicador direito estica = Y',
        texto: 'ty rt yu yt tr uy ty rt yu yt tr uy we io rt yu ty we io tr uy'
      },
      {
        id: 's5', num: 5, tipo: 'TREINO', titulo: 'Adicionar Q e P',
        teclas: ['q','p','w','o','e','i','r','u','t','y'],
        instrucao: 'A fileira completa! <strong>Q</strong> (mindinho esquerdo sobe) e <strong>P</strong> (mindinho direito sobe).',
        dica: '🤙 Mindinho esquerdo sobe = Q · Mindinho direito sobe = P',
        texto: 'qp woe iur tyu qwe rui opi qwer tyui qwer tyui poi qwe rty uio'
      },
      {
        id: 's6', num: 6, tipo: 'PALAVRAS', titulo: 'Palavras — Superior + Meio',
        teclas: ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','j','k','l'],
        instrucao: 'Agora misturamos as duas fileiras! Dedos voltam sempre à home row entre as palavras.',
        dica: '📝 Mistura das fileiras do meio e superior',
        texto: 'rio pro ira ole fora lado oral pura lado riso puro olas fira dura pelo'
      }
    ]
  },
  {
    id: 'inferior',
    nome: 'Fileira Inferior',
    apelido: 'Bottom Row',
    cor: 'inferior',
    icon: '⬇️',
    teclas: 'Z X C V B N M',
    teclasList: ['z','x','c','v','b','n','m'],
    descricao: 'As teclas de baixo. Complete o seu domínio do teclado!',
    licoes: [
      {
        id: 'i1', num: 1, tipo: 'INTRO', titulo: 'Teclas V e N',
        teclas: ['v','n'],
        instrucao: '<strong>V</strong> (indicador esquerdo desce) e <strong>N</strong> (indicador direito desce). Parta do F e J.',
        dica: '👇 Indicador esquerdo desce = V · Indicador direito desce = N',
        texto: 'vn nv vn nv vv nn vn nv vn nv vv nn nv vn vv nn vn nv vn vv nn'
      },
      {
        id: 'i2', num: 2, tipo: 'TREINO', titulo: 'Adicionar C e M',
        teclas: ['c','m','v','n'],
        instrucao: '<strong>C</strong> (médio esquerdo desce) e <strong>M</strong> (indicador direito estica).',
        dica: '🖕 Médio esquerdo desce = C · Direita M',
        texto: 'cm vn mc nv cm vn mc nv cm mv cn nv vn cm mc cn vn cm nv mc cn'
      },
      {
        id: 'i3', num: 3, tipo: 'TREINO', titulo: 'Adicionar X e B',
        teclas: ['x','b','c','m','v','n'],
        instrucao: '<strong>X</strong> (anelar esquerdo desce) e <strong>B</strong> (indicador esquerdo estica ainda mais).',
        dica: '💍 Anelar esquerdo desce = X · Indicador estica = B',
        texto: 'xb cv nm bx vc mn xb cv nm bx vc mn xc bv nm cx vb mn xb cv nm'
      },
      {
        id: 'i4', num: 4, tipo: 'TREINO', titulo: 'Adicionar Z',
        teclas: ['z','x','c','v','b','n','m'],
        instrucao: '<strong>Z</strong> — mindinho esquerdo desce. A fileira inferior completa!',
        dica: '🤙 Mindinho esquerdo desce = Z',
        texto: 'zx cv bnm zx cv bnm zxc vbn zxc vbn zbm xcv zxc vbn zbm xcv zxc vbn'
      },
      {
        id: 'i5', num: 5, tipo: 'PALAVRAS', titulo: 'Palavras — Três Fileiras',
        teclas: ['a','s','d','f','j','k','l','q','w','e','r','t','y','u','i','o','p','z','x','c','v','b','n','m'],
        instrucao: 'Parabéns! Agora usamos as três fileiras! A postura vai melhorar muito.',
        dica: '📝 Três fileiras juntas — foque na postura!',
        texto: 'como vida zona fixo belo cima vejo xico zona bela como vida fixo belo cima'
      },
      {
        id: 'i6', num: 6, tipo: 'VELOCIDADE', titulo: 'Desafio Final — Teclado Completo',
        teclas: ['a','s','d','f','j','k','l','q','w','e','r','t','y','u','i','o','p','z','x','c','v','b','n','m'],
        instrucao: '🏆 <strong>Desafio final!</strong> Use o teclado completo. Demonstre tudo que aprendeu!',
        dica: '⏱️ Qualidade antes de velocidade. Olhe pro monitor, não pro teclado!',
        texto: 'viva bom dia como vai bem aqui fora sol azul rio mar vida nome zona fixo'
      }
    ]
  }
];

let licaoState = {
  fileira: null,
  licao: null,
  texto: '',
  pos: 0,
  erros: 0,
  caracteresErrados: 0,
  inicio: 0,
  timerId: null,
  finalizado: false
};

function abrirFileiras() {
  renderFileirasTrilha();
  mostrarTela('screen-digitacao-fileiras');
}

function voltarParaFileiras() {
  if (licaoState.timerId) clearInterval(licaoState.timerId);
  document.removeEventListener('keydown', listenerLicao);
  abrirFileiras();
}

function getLicaoProg() {
  if (!alunoAtivo) return {};
  return alunoAtivo.progresso?.licoes || {};
}

function saveLicaoProg(prog) {
  if (!alunoAtivo) return;
  if (!alunoAtivo.progresso) alunoAtivo.progresso = {};
  alunoAtivo.progresso.licoes = prog;
  _digSalvarAluno(alunoAtivo);
}

function renderFileirasTrilha() {
  const prog = getLicaoProg();
  let html = '';

  FILEIRAS.forEach(fileira => {
    const feitas = fileira.licoes.filter(l => prog[l.id]?.estrelas > 0).length;
    const pct = Math.round((feitas / fileira.licoes.length) * 100);

    html += `<div class="fileira-secao">
      <div class="fileira-header ${fileira.cor}">
        <div class="fileira-header-icon">${fileira.icon}</div>
        <div class="fileira-header-info">
          <div class="fileira-header-tag">${fileira.apelido}</div>
          <div class="fileira-header-nome">${fileira.nome}</div>
          <div class="fileira-header-teclas">${fileira.teclas}</div>
        </div>
        <div class="fileira-header-prog">
          <div class="fileira-header-prog-val">${pct}%</div>
          <div class="fileira-header-prog-label">COMPLETO</div>
        </div>
      </div>
      <div class="licoes-grid">`;

    let desbloqueada = true;
    fileira.licoes.forEach((licao, idx) => {
      const p = prog[licao.id];
      const done = p?.estrelas > 0;
      const isNext = !done && desbloqueada;
      const locked = !desbloqueada && !done;

      let estrelas = '☆☆☆';
      if (p?.estrelas >= 3) estrelas = '⭐⭐⭐';
      else if (p?.estrelas >= 2) estrelas = '⭐⭐☆';
      else if (p?.estrelas >= 1) estrelas = '⭐☆☆';

      let cls = 'licao-card';
      if (done) cls += ' done';
      else if (isNext) cls += ' current';
      else if (locked) cls += ' locked';

      const onclick = locked ? '' : `onclick="iniciarLicao('${fileira.id}', '${licao.id}')"`;

      html += `<div class="${cls}" ${onclick}>
        ${locked ? '<span class="lock-icon">🔒</span>' : ''}
        <div class="licao-num">${licao.num}</div>
        <div class="licao-tipo">${licao.tipo}</div>
        <div class="licao-teclas">${licao.teclas.map(k=>k.toUpperCase()).join(' ')}</div>
        <div class="licao-stars">${estrelas}</div>
      </div>`;

      if (done) desbloqueada = true;
      else if (isNext) desbloqueada = false;
      else desbloqueada = false;
    });

    html += `</div></div>`;
  });

  document.getElementById('fileirasTrilha').innerHTML = html;
}

function iniciarLicao(fileiraId, licaoId) {
  const fileira = FILEIRAS.find(f => f.id === fileiraId);
  const licao = fileira?.licoes.find(l => l.id === licaoId);
  if (!fileira || !licao) return;

  licaoState = {
    fileira: fileira,
    licao: licao,
    texto: licao.texto,
    pos: 0, erros: 0, caracteresErrados: 0,
    inicio: 0, timerId: null, finalizado: false
  };

  document.getElementById('licaoTopTitle').textContent =
    `${fileira.icon} ${fileira.nome} — Lição ${licao.num}`;

  // Header da lição
  document.getElementById('licaoHeader').innerHTML = `
    <div class="dig-licao-header ${fileira.cor}">
      <div class="dig-licao-header-num">${licao.num}</div>
      <div class="dig-licao-header-info">
        <div class="dig-licao-header-titulo">${licao.titulo}</div>
        <div class="dig-licao-header-sub">${licao.tipo} · ${fileira.nome}</div>
      </div>
      <div class="dig-licao-estrelas" id="licaoEstrelasLive">☆☆☆</div>
    </div>`;

  // Instrução
  document.getElementById('licaoInstrucao').innerHTML = `
    <div class="licao-instrucao ${fileira.cor}">
      <div class="licao-instrucao-icon">💡</div>
      <div class="licao-instrucao-text">
        ${licao.instrucao}
        <div class="licao-keys-destaque">
          ${licao.teclas.map(k => `<span class="licao-key-chip ${fileira.cor}">${k.toUpperCase()}</span>`).join('')}
        </div>
        <em style="font-size:13px; opacity:0.8;">${licao.dica}</em>
      </div>
    </div>`;

  document.getElementById('licaoResultado').innerHTML = '';
  renderTextoLicao();
  renderTecladoLicao();
  atualizarStatsLicao();
  mostrarTela('screen-digitacao-licao');
  document.addEventListener('keydown', listenerLicao);
}

function renderTextoLicao() {
  const html = '<div class="char-boxes">' + licaoState.texto.split('').map((c, i) => {
    let cls = 'char-box';
    if (c === ' ') cls += ' space-char';
    if (i < licaoState.pos) cls += ' done';
    else if (i === licaoState.pos) cls += ' current';
    const display = c === ' ' ? '' : escapeHtml(c);
    return `<div class="${cls}" data-i="${i}">${display}</div>`;
  }).join('') + '</div>';
  document.getElementById('licaoTextoBox').innerHTML = html;
  // scroll current into view
  const cur = document.querySelector('.char-box.current');
  if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function renderTecladoLicao() {
  const fileira = licaoState.fileira;
  const licao = licaoState.licao;

  const rowMaps = {
    superior: ['q','w','e','r','t','y','u','i','o','p'],
    meio: ['a','s','d','f','g','h','j','k','l','ç'],
    inferior: ['z','x','c','v','b','n','m']
  };

  const linhas = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ç'],
    ['Z','X','C','V','B','N','M']
  ];

  let html = '';
  linhas.forEach((linha, li) => {
    const rowName = li === 0 ? 'superior' : li === 1 ? 'meio' : 'inferior';
    html += '<div class="teclado-linha">';
    if (li === 1) html += '<div class="tecla wide-1.5">Caps</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    linha.forEach(letra => {
      const key = letra.toLowerCase();
      const isLicaoKey = licao.teclas.includes(key);
      const isRowKey = rowMaps[rowName]?.includes(key);
      let cls = 'tecla';
      if (isLicaoKey) cls += ` lesson-key row-${fileira.cor}`;
      else if (isRowKey) cls += ` row-${rowName === 'medio' ? 'meio' : rowName}`;
      html += `<div class="${cls}" data-tecla="${key}" data-finger="">${letra}</div>`;
    });
    if (li === 1) html += '<div class="tecla wide-1.5">Enter</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    html += '</div>';
  });
  html += '<div class="teclado-linha"><div class="tecla wide-3" data-tecla=" ">Espaço</div></div>';
  document.getElementById('licaoTeclado').innerHTML = html;
  destacarProximaTeclaLicao();
  renderGuiaMao();
}

function renderGuiaMao() {
  const licao = licaoState.licao;
  // determine which fingers are needed
  const dedosNecessarios = new Set();
  (licao.teclas || []).forEach(k => {
    if (FINGER_MAP[k] !== undefined) dedosNecessarios.add(FINGER_MAP[k]);
  });

  // finger names
  const nomes = ['', 'Mínimo', 'Anelar', 'Médio', 'Indicador', 'Polegar'];
  const cores = ['', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  function buildHand(side) {
    // Detailed hand SVG with dark theme, 120x160 viewBox
    // fingers: 1(pinky), 2(ring), 3(middle), 4(index), 5(thumb)
    let fingerPos, fingerLen;
    if (side === 'left') {
      // [tipX, tipY, baseX, baseY] for each finger
      fingerPos = {
        1:{tx:88,ty:75, bx:84,by:108}, // pinky
        2:{tx:70,ty:55, bx:68,by:105}, // ring
        3:{tx:52,ty:46, bx:52,by:105}, // middle
        4:{tx:34,ty:53, bx:36,by:105}, // index
        5:{tx:14,ty:108,bx:28,by:120}  // thumb
      };
    } else {
      fingerPos = {
        1:{tx:32,ty:75, bx:36,by:108}, // pinky
        2:{tx:50,ty:55, bx:52,by:105}, // ring
        3:{tx:68,ty:46, bx:68,by:105}, // middle
        4:{tx:86,ty:53, bx:84,by:105}, // index
        5:{tx:106,ty:108,bx:92,by:120} // thumb
      };
    }
    const palmPath = side === 'left'
      ? `M22,128 Q18,100 22,85 L36,112 L52,112 L68,112 L84,112 L90,90 Q95,105 92,128 Q78,136 52,136 Q28,136 22,128 Z`
      : `M98,128 Q102,100 98,85 L84,112 L68,112 L52,112 L36,112 L30,90 Q25,105 28,128 Q42,136 68,136 Q92,136 98,128 Z`;
    // finger rectangles with rounded caps
    let fingers = '';
    for (let f = 1; f <= 5; f++) {
      const p = fingerPos[f];
      const ativo = dedosNecessarios.has(f);
      const col = ativo ? cores[f] : '#334155';
      const glowId = `glow-${side}-${f}`;
      // draw finger as rounded rect from base to tip
      const dx = p.tx - p.bx, dy = p.ty - p.by;
      const len = Math.sqrt(dx*dx+dy*dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const w = f === 5 ? 14 : 12; // thumb wider
      fingers += `<g transform="translate(${p.bx},${p.by}) rotate(${angle})">
        <rect x="${-w/2}" y="${-len}" width="${w}" height="${len}" rx="${w/2}" fill="${col}" opacity="${ativo ? 1 : 0.6}"/>
        ${ativo ? `<rect x="${-w/2}" y="${-len}" width="${w}" height="${len}" rx="${w/2}" fill="url(#${glowId})" opacity="0.5"/>` : ''}
      </g>`;
      if (ativo) {
        fingers = `<defs><radialGradient id="${glowId}"><stop offset="0%" stop-color="${col}" stop-opacity="0.8"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>` + fingers;
      }
      // fingertip circle with number
      fingers += `<circle cx="${p.tx}" cy="${p.ty}" r="${f===5?9:8}" fill="${col}" opacity="${ativo?1:0.7}"/>`;
      if (ativo) {
        fingers += `<circle cx="${p.tx}" cy="${p.ty}" r="${f===5?13:12}" fill="none" stroke="${col}" stroke-width="2" opacity="0.4" class="guia-pulse-${side}-${f}"/>`;
      }
      fingers += `<text x="${p.tx}" y="${p.ty+4}" text-anchor="middle" fill="white" font-size="8" font-weight="800" font-family="sans-serif">${f}</text>`;
    }
    const svgW = side === 'left' ? 120 : 120;
    return `<svg width="${svgW}" height="145" viewBox="0 0 120 145" style="filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">
      <path d="${palmPath}" fill="#1E293B" stroke="#334155" stroke-width="1.5"/>
      ${fingers}
    </svg>`;
  }

  const legendItems = Array.from(dedosNecessarios).map(f =>
    `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;color:${cores[f]};font-weight:700;background:${cores[f]}18;border:1px solid ${cores[f]}40;border-radius:20px;padding:3px 8px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${cores[f]};display:inline-block;box-shadow:0 0 6px ${cores[f]};"></span>${nomes[f]}
    </span>`
  ).join('');

  const html = `<div style="background:#0F172A;border-radius:16px;padding:16px;margin:12px 0 8px;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
    <div style="font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;text-align:center;">Posição dos Dedos</div>
    <div style="display:flex;gap:16px;align-items:flex-end;justify-content:center;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <span style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Esquerda</span>
        ${buildHand('left')}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <span style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Direita</span>
        ${buildHand('right')}
      </div>
    </div>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">${legendItems}</div>
  </div>`;

  let guia = document.getElementById('licaoGuiaMao');
  if (!guia) {
    guia = document.createElement('div');
    guia.id = 'licaoGuiaMao';
    const teclado = document.getElementById('licaoTeclado');
    teclado.parentNode.insertBefore(guia, teclado);
  }
  guia.innerHTML = html;
}

function destacarProximaTeclaLicao() {
  document.querySelectorAll('#licaoTeclado .tecla').forEach(t => t.classList.remove('next'));
  if (licaoState.pos >= licaoState.texto.length) return;
  const proxChar = licaoState.texto[licaoState.pos].toLowerCase();
  document.querySelectorAll(`#licaoTeclado .tecla[data-tecla="${proxChar}"]`).forEach(t => t.classList.add('next'));
}

function listenerLicao(e) {
  if (licaoState.finalizado) return;
  if (e.key === 'Escape') { voltarParaFileiras(); return; }
  if (e.key.length !== 1) return;

  if (licaoState.pos === 0 && !licaoState.inicio) {
    licaoState.inicio = Date.now();
    licaoState.timerId = setInterval(atualizarStatsLicao, 250);
  }

  const esperado = licaoState.texto[licaoState.pos];
  const digitado = e.key;

  // flash na tecla
  const t = document.querySelector(`#licaoTeclado .tecla[data-tecla="${digitado.toLowerCase()}"]`);
  if (t) {
    t.classList.add('pressed');
    setTimeout(() => t.classList.remove('pressed'), 120);
  }

  const certo = normalizarChar(esperado) === normalizarChar(digitado);

  const spans = document.querySelectorAll('#licaoTextoBox .char-box');
  if (certo) {
    if (spans[licaoState.pos]) {
      spans[licaoState.pos].classList.remove('current','wrong');
      spans[licaoState.pos].classList.add('done');
    }
    licaoState.pos++;
    if (licaoState.pos >= licaoState.texto.length) {
      finalizarLicao(); return;
    }
    if (spans[licaoState.pos]) {
      spans[licaoState.pos].classList.add('current');
      spans[licaoState.pos].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    destacarProximaTeclaLicao();
  } else {
    licaoState.erros++;
    licaoState.caracteresErrados++;
    if (spans[licaoState.pos]) {
      spans[licaoState.pos].classList.add('wrong');
      setTimeout(() => spans[licaoState.pos]?.classList.remove('wrong'), 400);
    }
  }
  atualizarStatsLicao();
}

function atualizarStatsLicao() {
  const tempoMs = licaoState.inicio ? (Date.now() - licaoState.inicio) : 0;
  document.getElementById('licaoTempo').textContent = Math.floor(tempoMs/1000) + 's';
  document.getElementById('licaoAcertos').textContent = licaoState.pos;
  const total = licaoState.pos + licaoState.caracteresErrados;
  const prec = total > 0 ? Math.round((licaoState.pos / total) * 100) : 100;
  document.getElementById('licaoPrecisao').textContent = prec + '%';
  document.getElementById('licaoProgresso').textContent =
    Math.round((licaoState.pos / licaoState.texto.length) * 100) + '%';

  // estrelas ao vivo
  const estrelas = calcularEstrelasLicao(prec, licaoState.erros);
  const el = document.getElementById('licaoEstrelasLive');
  if (el) el.textContent = (estrelas >= 1 ? '⭐' : '☆') + (estrelas >= 2 ? '⭐' : '☆') + (estrelas >= 3 ? '⭐' : '☆');
}

function calcularEstrelasLicao(precisao, erros) {
  if (precisao >= 95 && erros <= 3) return 3;
  if (precisao >= 80 && erros <= 10) return 2;
  if (precisao >= 60) return 1;
  return 0;
}

function finalizarLicao() {
  licaoState.finalizado = true;
  if (licaoState.timerId) clearInterval(licaoState.timerId);
  document.removeEventListener('keydown', listenerLicao);

  const tempoSeg = (Date.now() - licaoState.inicio) / 1000;
  const total = licaoState.texto.length + licaoState.caracteresErrados;
  const precisao = Math.round((licaoState.texto.length / total) * 100);
  const estrelas = calcularEstrelasLicao(precisao, licaoState.erros);

  // salva progresso
  const prog = getLicaoProg();
  const ant = prog[licaoState.licao.id];
  if (!ant || estrelas > ant.estrelas) {
    prog[licaoState.licao.id] = { estrelas, precisao, tempo: Math.floor(tempoSeg) };
    saveLicaoProg(prog);
  }

  // pontos
  const pts = estrelas * 20 + (precisao - 60) * 0.5;
  if (pts > 0 && alunoAtivo) _digSalvarPontos(Math.round(pts));

  const msgs = ['💪 Continua treinando!', '👍 Bom trabalho!', '⚡ Excelente!', '🌟 Perfeito!'];
  const msg = msgs[estrelas] || msgs[0];
  const estrelasHTML = (estrelas >= 1 ? '⭐' : '☆') + (estrelas >= 2 ? '⭐' : '☆') + (estrelas >= 3 ? '⭐' : '☆');

  // descobre próxima lição
  const fileira = licaoState.fileira;
  const licaoAtual = licaoState.licao;
  const idx = fileira.licoes.indexOf(licaoAtual);
  const proxLicao = fileira.licoes[idx + 1] || null;

  document.getElementById('licaoResultado').innerHTML = `
    <div class="dig-completo" style="margin-top:14px;">
      <div style="font-size:52px; margin-bottom:8px;">${estrelasHTML}</div>
      <div style="font-size:26px; font-weight:800; margin-bottom:6px;">${msg}</div>
      <div style="font-size:15px; opacity:0.9; margin-bottom:6px;">
        Precisão: ${precisao}% · ${licaoState.erros} erros · ${Math.floor(tempoSeg)}s
      </div>
      <div style="font-size:20px; font-weight:900; margin-bottom:16px;">+${Math.max(0,Math.round(pts))} ⭐</div>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button class="btn ghost" style="background:rgba(255,255,255,0.2);color:white;" onclick="iniciarLicao('${fileira.id}','${licaoAtual.id}')">↻ Repetir</button>
        ${proxLicao ? `<button class="btn" style="background:white;color:var(--green);font-weight:800;" onclick="iniciarLicao('${fileira.id}','${proxLicao.id}')">Próxima lição →</button>` : ''}
        <button class="btn" style="background:rgba(0,0,0,0.2);color:white;" onclick="voltarParaFileiras()">Trilha</button>
      </div>
    </div>`;
}

// =============================================================

// RANKEADA DE TEXTOS — Corrida contra o relógio
// =============================================================

const TEXTOS_RANKEADA = [
  { id: 'txt01', titulo: 'A História do Computador', nivel: 'facil', texto: `O computador e uma das invencoes mais importantes da historia da humanidade. Tudo comecou na decada de 1940, quando os primeiros computadores eram enormes maquinas que ocupavam salas inteiras. O ENIAC, construido em 1945 nos Estados Unidos, pesava 30 toneladas e usava valvulas eletronicas para fazer calculos.

Com o tempo, os computadores foram ficando menores e mais poderosos. Na decada de 1970, surgiram os primeiros microcomputadores, que ja podiam ser usados em casa. Depois vieram os notebooks, os tablets e os smartphones, que hoje cabem na palma da mao.

Hoje em dia, o computador esta em todos os lugares. Ele controla avioes, carros, hospitais e ate a geladeira de casa. Aprender a usar o computador e uma habilidade essencial para qualquer pessoa que queira ter boas oportunidades no futuro.` },

  { id: 'txt02', titulo: 'Hardware: As Peças do PC', nivel: 'facil', texto: `O hardware e a parte fisica do computador, ou seja, tudo que voce pode tocar. As pecas mais importantes sao o processador, a memoria RAM, o HD ou SSD, a placa-mae e a fonte de energia.

O processador, tambem chamado de CPU, e o cerebro do computador. Ele faz todos os calculos e processa as informacoes. A memoria RAM e onde o computador guarda os dados que esta usando no momento. Quando voce desliga o PC, tudo que estava na RAM e apagado.

O HD e o SSD sao os discos de armazenamento. Eles guardam seus arquivos, fotos, musicas e programas de forma permanente. A diferenca e que o SSD e muito mais rapido que o HD tradicional, porque nao tem partes mecanicas girando.

A placa-mae conecta todas as pecas e permite que elas se comuniquem entre si. A fonte de energia transforma a energia eletrica da tomada em energia que o computador consegue usar.` },

  { id: 'txt03', titulo: 'Software e Sistemas Operacionais', nivel: 'facil', texto: `Software e o nome dado a todos os programas e aplicativos que existem dentro do computador. Diferente do hardware, o software nao pode ser tocado. Ele e formado por codigo, que sao instrucoes escritas por programadores para dizer ao computador o que fazer.

O software mais importante de qualquer dispositivo e o sistema operacional. Ele e responsavel por fazer o computador funcionar e abrir todos os outros programas. Os sistemas operacionais mais famosos sao o Windows, o macOS e o Linux.

No celular, os sistemas mais usados sao o Android e o iOS. Sem o sistema operacional, o computador seria apenas um monte de pecas sem utilidade. E ele que organiza tudo e permite que voce use programas como o Word, o Chrome e os jogos.

Os aplicativos sao softwares feitos para funcoes especificas. O WhatsApp e um aplicativo de mensagens. O Spotify e um aplicativo de musica. Cada um tem um objetivo claro e foi programado para cumprir aquela funcao da melhor forma possivel.` },

  { id: 'txt04', titulo: 'Como a Internet Funciona', nivel: 'medio', texto: `A internet e uma rede global que conecta bilhoes de computadores, celulares e outros dispositivos ao redor do mundo. Para que ela funcione, existem milhares de cabos submarinos que atravessam os oceanos, alem de torres de transmissao e satelites no espaco.

Quando voce acessa um site, seu computador envia uma solicitacao para um servidor, que e um computador potente guardado em algum lugar do mundo. Esse servidor processa o pedido e manda de volta as informacoes do site. Tudo isso acontece em fracoes de segundo.

Os dados trafegam pela internet no formato de pacotes. Cada pacote percorre um caminho diferente e todos se juntam quando chegam ao destino. Esse sistema e chamado de comutacao de pacotes e foi inventado para que a rede nunca ficasse totalmente fora do ar.

Para identificar os servidores na rede, cada um tem um endereco IP, que funciona como o CEP de uma casa. O sistema de nomes de dominio, chamado de DNS, traduz os enderecos de sites como google.com em numeros que os computadores entendem.

A velocidade da internet e medida em megabits por segundo. Quanto maior o numero, mais rapida e a conexao e mais rapido voce consegue baixar arquivos, assistir videos e jogar online.` },

  { id: 'txt05', titulo: 'Segurança Digital', nivel: 'medio', texto: `Seguranca digital e o conjunto de praticas e ferramentas usadas para proteger computadores, dados e usuarios de ameacas na internet. Com o aumento do uso da tecnologia, os riscos tambem cresceram. Virus, golpes online e roubo de senhas sao problemas que afetam milhoes de pessoas todos os anos.

Um virus de computador e um programa malicioso que se espalha de arquivo em arquivo e pode causar danos como apagar dados, roubar senhas e ate bloquear o computador. O antivirus e o software responsavel por detectar e eliminar essas ameacas.

O phishing e um dos golpes mais comuns na internet. Os criminosos enviam mensagens falsas fingindo ser bancos ou lojas conhecidas para roubar senhas e dados pessoais. Para se proteger, nunca clique em links suspeitos e sempre confirme se o site e verdadeiro antes de digitar qualquer informacao.

Uma senha forte e a primeira linha de defesa contra invasores. Use combinacoes de letras maiusculas, minusculas, numeros e simbolos. Nunca use datas de aniversario ou nomes faceis de adivinhar. Se possivel, ative a verificacao em duas etapas nas suas contas.

Fazer backup e outra pratica essencial. Manter copias dos seus arquivos em um HD externo ou na nuvem garante que voce nao perca tudo em caso de virus, roubo ou defeito no computador.` },

  { id: 'txt06', titulo: 'O Que É Programação', nivel: 'medio', texto: `Programacao e a arte de escrever instrucoes para que o computador execute tarefas. Essas instrucoes sao escritas em linguagens de programacao, que sao idiomas especiais com regras proprias que tanto humanos quanto maquinas conseguem entender.

Existem dezenas de linguagens de programacao, cada uma com suas caracteristicas. O Python e famoso por ser simples e legivel, sendo muito usado em ciencia de dados e inteligencia artificial. O JavaScript roda nos navegadores e e essencial para criar paginas web interativas.

Um programador analisa um problema, pensa em uma solucao logica e traduz essa solucao em codigo. O codigo e entao testado varias vezes para garantir que funciona corretamente e nao tem erros, chamados de bugs.

A logica de programacao e a base de tudo. Antes de aprender qualquer linguagem, e importante entender conceitos como variaveis, condicoes, repeticoes e funcoes. Uma variavel e como uma caixa que guarda um valor. Uma condicao e uma escolha que o programa faz.

Hoje, a programacao esta presente em praticamente tudo. Aplicativos de celular, jogos, sistemas bancarios, sites e carros autonomos foram criados por programadores. Saber programar e uma das habilidades mais valorizadas no mercado de trabalho atual.` },

  { id: 'txt07', titulo: 'Inteligência Artificial', nivel: 'dificil', texto: `Inteligencia artificial, ou IA, e a area da computacao dedicada a criar sistemas capazes de realizar tarefas que normalmente exigiriam inteligencia humana. Reconhecer rostos em fotos, traduzir idiomas, jogar xadrez e dirigir carros sao exemplos do que a IA ja consegue fazer.

O aprendizado de maquina, conhecido como machine learning, e a principal tecnica usada na IA moderna. Em vez de ser programado com regras fixas, o sistema aprende sozinho analisando grandes volumes de dados. Quanto mais dados ele processa, mais preciso se torna.

As redes neurais artificiais sao inspiradas no funcionamento do cerebro humano. Elas sao compostas por camadas de neuronios digitais que processam informacoes em conjunto. O deep learning usa redes neurais com muitas camadas para resolver problemas complexos como reconhecimento de voz e imagem.

Hoje, a IA esta presente no cotidiano de formas que muitas vezes passam despercebidas. Os algoritmos de recomendacao do YouTube e do Netflix sao IA. O assistente de voz do celular e IA. Os filtros de spam do email sao IA. Os carros que freiam automaticamente ao detectar obstaculos usam IA.

A inteligencia artificial tambem traz desafios importantes. Questoes eticas sobre privacidade, vies algoritmico e impacto no emprego sao debatidas por pesquisadores, governos e empresas. O futuro da IA depende nao apenas da tecnologia, mas tambem das escolhas que a sociedade fara sobre como utiliza-la.` },

  { id: 'txt08', titulo: 'Redes de Computadores', nivel: 'dificil', texto: `Uma rede de computadores e um conjunto de dispositivos conectados entre si para compartilhar dados e recursos. A internet e a maior rede de computadores do mundo, mas redes menores existem em casas, empresas e escolas.

A rede local, chamada de LAN, conecta computadores em um mesmo ambiente, como uma escola ou escritorio. A conexao pode ser feita por cabos de rede ou por Wi-Fi. O roteador e o dispositivo responsavel por distribuir a conexao a internet para todos os dispositivos da rede.

Cada dispositivo em uma rede e identificado por um endereco IP. Existem dois tipos: o endereco IP privado, usado dentro da rede local, e o endereco IP publico, visivel para a internet. O protocolo TCP/IP define como os dados sao enviados e recebidos entre os dispositivos.

A seguranca em redes e fundamental. Um firewall monitora o trafego e bloqueia acessos nao autorizados. A criptografia protege os dados durante a transmissao, tornando-os ilegiveis para quem nao tem a chave correta. O protocolo HTTPS garante que a comunicacao entre seu navegador e os sites seja criptografada.

O modelo cliente-servidor e a base de funcionamento da maioria dos servicos online. O cliente e o dispositivo que faz uma requisicao, como seu celular acessando o Instagram. O servidor recebe esse pedido e envia a resposta. Os servidores ficam em datacenters, que sao galpoes gigantes com milhares de computadores funcionando ininterruptamente.` },

  { id: 'txt09', titulo: 'Computação em Nuvem', nivel: 'dificil', texto: `A computacao em nuvem, ou cloud computing, e a entrega de servicos de computacao pela internet. Em vez de ter programas instalados no computador e arquivos guardados no HD, tudo fica em servidores remotos acessiveis de qualquer dispositivo com internet.

Os tres modelos principais de nuvem sao o IaaS, o PaaS e o SaaS. O IaaS, Infrastructure as a Service, oferece infraestrutura virtual como servidores e armazenamento. O PaaS, Platform as a Service, fornece um ambiente para desenvolver e publicar aplicacoes. O SaaS, Software as a Service, entrega software pronto pelo navegador, como o Google Docs.

As tres maiores empresas de computacao em nuvem sao Amazon Web Services, Microsoft Azure e Google Cloud. Juntas, elas sustentam grande parte da infraestrutura digital global, desde startups ate grandes corporacoes e governos.

As vantagens da nuvem sao muitas. Nao e preciso comprar servidores caros. A capacidade pode ser aumentada ou reduzida conforme a necessidade. As atualizacoes acontecem automaticamente. E os dados ficam acessiveis de qualquer lugar do mundo.

Por outro lado, a dependencia da internet e um ponto critico. Se a conexao cair, o acesso aos servicos pode ser interrompido. A privacidade dos dados tambem e uma preocupacao, ja que as informacoes ficam armazenadas em servidores de terceiros. Por isso, a escolha de um provedor confiavel e o uso de criptografia sao fundamentais.` },

  { id: 'txt10', titulo: 'O Futuro da Tecnologia', nivel: 'dificil', texto: `A tecnologia avanca em um ritmo cada vez mais acelerado. O que era ficcao cientifica ha vinte anos hoje e realidade, e o que parece impossivel hoje pode ser comum daqui a uma decada. Entender as tendencias tecnologicas e essencial para se preparar para o mundo do futuro.

A internet das coisas, conhecida como IoT, conecta objetos do cotidiano a internet. Geladeiras que fazem lista de compras, relogios que monitoram a saude, casas que ajustam a temperatura automaticamente. Estima-se que mais de 75 bilhoes de dispositivos estarao conectados a internet nos proximos anos.

A computacao quantica promete resolver problemas que os computadores atuais levariam seculos para calcular. Em vez de bits, que representam zero ou um, os computadores quanticos usam qubits, que podem representar zero, um ou ambos ao mesmo tempo.

O metaverso e um conceito de internet imersiva, onde as pessoas interagem em ambientes virtuais tridimensionais usando oculos de realidade virtual ou aumentada. Empresas como Meta e Microsoft ja investem bilhoes nessa direcao.

A tecnologia 5G, com velocidades ate cem vezes maiores que o 4G, vai viabilizar carros autonomos, cirurgias remotas e cidades inteligentes. A ciberseguranca se tornara ainda mais critica, pois quanto mais conectado e o mundo, maiores sao as superficies de ataque para criminosos digitais. Construir uma base solida em informatica hoje e investir diretamente no seu futuro.` }
];

const RANKEADA_CONFIG = {
  facil:   { tempoBase: 180, penalidade: 3,  bonus: 0,   mult: {1:1.4, 2:1.1, 3:1.0} },
  medio:   { tempoBase: 150, penalidade: 5,  bonus: 0,   mult: {1:1.3, 2:1.0, 3:0.85} },
  dificil: { tempoBase: 120, penalidade: 8,  bonus: 0,   mult: {1:1.2, 2:1.0, 3:0.75} },
  elite:   { tempoBase: 90,  penalidade: 12, bonus: 0,   mult: {1:1.1, 2:1.0, 3:0.65} }
};

let rankeadaState = { texto:null, pos:0, erros:0, tempoRestante:0, tempoTotal:0, timerId:null, finalizado:false, inicio:0, dif:'facil', cfg:null };

function abrirMenuRankeada() {
  rankeadaState.dif = rankeadaState.dif || 'facil';
  renderMenuRankeada();
  mostrarTela('screen-digitacao-rankeada-menu');
}

function renderMenuRankeada() {
  const nivel = alunoAtivo?.nivel || 1;
  const dif = rankeadaState.dif;
  const cfg = RANKEADA_CONFIG[dif];
  const tempo = Math.round(cfg.tempoBase * (cfg.mult[nivel] || 1));
  const nivelStr = ['','Iniciante','Intermediário','Avançado'][nivel] || 'Aluno';
  document.getElementById('rankeadaMenuContent').innerHTML = `
    <div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:var(--radius);padding:28px;color:white;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;opacity:0.6;margin-bottom:6px;">RANKEADA DE TEXTOS</div>
      <div style="font-size:26px;font-weight:900;font-family:'Plus Jakarta Sans',sans-serif;margin-bottom:8px;">Corrida contra o relógio ⏱️</div>
      <div style="font-size:14px;opacity:0.75;line-height:1.6;">Complete o texto antes do tempo acabar. Cada <strong style="color:#10B981;">acerto ganha tempo</strong>, cada <strong style="color:#EF4444;">erro perde tempo</strong>. Quanto mais preciso, mais fácil fica!</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div style="background:var(--bg-2);border:2px solid var(--line);border-radius:var(--radius-sm);padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:var(--ink-soft);margin-bottom:4px;">SEU NÍVEL</div>
        <div style="font-size:20px;font-weight:900;">${nivelStr}</div>
      </div>
      <div style="background:var(--yellow-soft);border:2px solid var(--yellow);border-radius:var(--radius-sm);padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:800;letter-spacing:1.5px;color:#92400E;margin-bottom:4px;">TEMPO INICIAL</div>
        <div style="font-size:20px;font-weight:900;color:#78350F;">${Math.floor(tempo/60)}m ${String(tempo%60).padStart(2,'0')}s</div>
      </div>
    </div>
    <div class="section-titulo">DIFICULDADE</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
      ${['facil','medio','dificil','elite'].map((d,i)=>{
        const lb=['🟢 Fácil','🟡 Médio','🔴 Difícil','⚡ Elite'][i];
        const pn=['-2s','-4s','-6s','-10s'][i];
        const sel=dif===d;
        return `<div onclick="setDifRankeada('${d}')" style="padding:12px 6px;border:2px solid ${sel?'var(--ink)':'var(--line)'};background:${sel?'var(--ink)':'var(--bg-soft)'};color:${sel?'white':'var(--ink)'};border-radius:10px;cursor:pointer;text-align:center;transition:all 0.15s;">
          <div style="font-size:13px;font-weight:700;">${lb}</div>
          <div style="font-size:11px;opacity:0.7;margin-top:3px;">Erro: ${pn}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="section-titulo">ESCOLHA UM TEXTO</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${TEXTOS_RANKEADA.map((t,i)=>{
        const hist=(alunoAtivo?.progresso?.rankeada||[]).find(r=>r.id===t.id);
        const badge=hist?`<span style="background:var(--green-soft);color:#065F46;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:800;white-space:nowrap;">✓ ${hist.wpm} WPM</span>`:'';
        const difBadge={facil:'🟢',medio:'🟡',dificil:'🔴'}[t.nivel]||'⚡';
        return `<div onclick="iniciarRankeada('${t.id}')" style="background:var(--bg-2);border:2px solid var(--line);border-radius:var(--radius-sm);padding:14px 18px;cursor:pointer;display:flex;align-items:center;gap:14px;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--ink)';this.style.transform='translateX(4px)'" onmouseout="this.style.borderColor='var(--line)';this.style.transform=''">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:900;color:var(--ink-soft);width:24px;flex-shrink:0;text-align:center;">${i+1}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:15px;">${t.titulo}</div>
            <div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">${difBadge} ${t.nivel} · ${t.texto.length} caracteres</div>
          </div>
          ${badge}
        </div>`;
      }).join('')}
    </div>
    <button class="btn ghost full" onclick="abrirMenuDigitacao()">← Voltar para Digitação</button>`;
}

function setDifRankeada(d) {
  rankeadaState.dif = d;
  renderMenuRankeada();
}

function iniciarRankeada(textoId) {
  const texto = TEXTOS_RANKEADA.find(t=>t.id===textoId);
  if (!texto) return;
  const nivel = alunoAtivo?.nivel || 1;
  const dif = rankeadaState.dif || 'facil';
  const cfg = RANKEADA_CONFIG[dif];
  const tempo = Math.round(cfg.tempoBase * (cfg.mult[nivel] || 1));
  // normaliza quebras duplas para evitar duplo Enter
  const textoNorm = {...texto, texto: texto.texto.replace(/\n+/g, '\n').trim()};
  rankeadaState = { texto:textoNorm, pos:0, erros:0, tempoRestante:tempo, tempoTotal:tempo, timerId:null, finalizado:false, inicio:0, dif, cfg };
  document.getElementById('rankeadaTopTitle').textContent = `⏱️ ${texto.titulo}`;
  document.getElementById('rankeadaResultado').innerHTML = '';
  renderTextoRankeada();
  renderTecladoRankeada();
  atualizarTimerDisplay();
  mostrarTela('screen-digitacao-rankeada');
  document.addEventListener('keydown', listenerRankeada);
}

function renderTextoRankeada() {
  const html = rankeadaState.texto.texto.split('').map((c,i)=>{
    let cls='dig-char';
    if (c===' ') cls+=' space';
    if (i < rankeadaState.pos) cls+=' done';
    else if (i===rankeadaState.pos) cls+=' current';
    const disp = c==='\n' ? '↵<br>' : (c===' ' ? ' ' : escapeHtml(c));
    return `<span class="${cls}" data-i="${i}">${disp}</span>`;
  }).join('');
  const box = document.getElementById('rankeadaTextoBox');
  box.innerHTML = html;
  // scroll: centraliza o caractere atual dentro da caixa
  const cur = box.querySelector('.current');
  if (cur) {
    const target = cur.offsetTop - (box.clientHeight / 2) + (cur.offsetHeight / 2);
    box.scrollTop = Math.max(0, target);
  }
}

function renderTecladoRankeada() {
  const linhas = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L','Ç'],
    ['Z','X','C','V','B','N','M']
  ];
  let html = '';
  linhas.forEach((linha, li) => {
    html += '<div class="teclado-linha">';
    if (li === 1) html += '<div class="tecla wide-1.5">Caps</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    linha.forEach(letra => {
      const finger = FINGER_MAP[letra.toLowerCase()] || '';
      html += `<div class="tecla" data-tecla="${letra.toLowerCase()}" data-rkd="1" data-finger="${finger}">${letra}</div>`;
    });
    if (li === 1) html += '<div class="tecla wide-1.5">Enter</div>';
    if (li === 2) html += '<div class="tecla wide-2">Shift</div>';
    html += '</div>';
  });
  html += '<div class="teclado-linha"><div class="tecla wide-3" data-tecla=" " data-rkd="1" data-finger="5">Espaço</div></div>';
  const el = document.getElementById('rankeadaTeclado');
  if (el) { el.innerHTML = html; }
  const leg = document.getElementById('rankeadaTecladoLegenda');
  if (leg) leg.style.display = 'flex';
  destacarProximaTeclaRankeada();
}

function destacarProximaTeclaRankeada() {
  document.querySelectorAll('.tecla[data-rkd]').forEach(t => t.classList.remove('next'));
  if (!rankeadaState.texto || rankeadaState.pos >= rankeadaState.texto.texto.length) return;
  const proxChar = rankeadaState.texto.texto[rankeadaState.pos].toLowerCase();
  document.querySelectorAll(`.tecla[data-rkd][data-tecla="${proxChar}"]`).forEach(t => t.classList.add('next'));
}

function flashTeclaRankeada(char) {
  const t = document.querySelector(`.tecla[data-rkd][data-tecla="${char.toLowerCase()}"]`);
  if (!t) return;
  t.classList.add('pressed');
  setTimeout(() => t.classList.remove('pressed'), 120);
}

function atualizarTimerDisplay() {
  const t = rankeadaState.tempoRestante;
  const el = document.getElementById('rankeadaTimer');
  if (!el) return;
  const ts = Math.floor(t); el.textContent = `${Math.floor(ts/60)}:${String(ts%60).padStart(2,'0')}`;
  const pct = t / rankeadaState.tempoTotal;
  el.style.color = pct < 0.2 ? '#EF4444' : pct < 0.4 ? '#F59E0B' : 'var(--ink)';
  const barra = document.getElementById('rankeadaTimerBar');
  if (barra) barra.style.width = (pct*100)+'%';
  const prog = document.getElementById('rankeadaProgresso');
  if (prog) prog.textContent = Math.round(rankeadaState.pos/rankeadaState.texto.texto.length*100)+'%';
  const wpmEl = document.getElementById('rankeadaWpm');
  if (wpmEl && rankeadaState.inicio) {
    const seg = (Date.now()-rankeadaState.inicio)/1000;
    wpmEl.textContent = seg>0 ? Math.round((rankeadaState.pos/5)/seg*60) : 0;
  }
}

function listenerRankeada(e) {
  if (rankeadaState.finalizado) return;
  if (e.key==='Escape') { sairRankeada(); return; }
  const isEnter = e.key==='Enter';
  if (e.key.length!==1 && !isEnter) return;
  e.preventDefault();
  if (!rankeadaState.inicio) {
    rankeadaState.inicio = Date.now();
    rankeadaState.timerId = setInterval(()=>{
      rankeadaState.tempoRestante--;
      atualizarTimerDisplay();
      if (rankeadaState.tempoRestante<=0) finalizarRankeada(false);
    }, 1000);
  }
  const texto = rankeadaState.texto.texto;
  const esperado = texto[rankeadaState.pos];
  const digitado = isEnter ? '\n' : e.key;
  flashTeclaRankeada(digitado);
  const certo = normalizarChar(esperado)===normalizarChar(digitado) || (esperado==='\n' && isEnter);
  const spans = document.querySelectorAll('#rankeadaTextoBox .dig-char');
  if (certo) {
    spans[rankeadaState.pos]?.classList.remove('current','wrong');
    spans[rankeadaState.pos]?.classList.add('done');
    rankeadaState.pos++;
    if (rankeadaState.pos>=texto.length) { finalizarRankeada(true); return; }
    spans[rankeadaState.pos]?.classList.add('current');
    destacarProximaTeclaRankeada();
    // bônus de tempo por acerto
    const bon = rankeadaState.cfg?.bonus || 0;
    if (bon > 0) {
      rankeadaState.tempoRestante = Math.min(rankeadaState.tempoTotal, rankeadaState.tempoRestante + bon);
      atualizarTimerDisplay();
    }
  } else {
    rankeadaState.erros++;
    const pen = rankeadaState.cfg?.penalidade||3;
    rankeadaState.tempoRestante = Math.max(1, rankeadaState.tempoRestante-pen);
    atualizarTimerDisplay();
    spans[rankeadaState.pos]?.classList.add('wrong');
    setTimeout(()=>spans[rankeadaState.pos]?.classList.remove('wrong'), 300);
    const timerEl = document.getElementById('rankeadaTimer');
    if (timerEl) { timerEl.style.transform='scale(1.3)'; setTimeout(()=>timerEl.style.transform='', 250); }
  }
}

function finalizarRankeada(sucesso) {
  rankeadaState.finalizado = true;
  if (rankeadaState.timerId) clearInterval(rankeadaState.timerId);
  document.removeEventListener('keydown', listenerRankeada);
  const tempoGasto = rankeadaState.inicio ? (Date.now()-rankeadaState.inicio)/1000 : 1;
  const textoLen = rankeadaState.texto.texto.length;
  const wpm = Math.round((textoLen/5)/tempoGasto*60);
  const precisao = Math.round((textoLen/(textoLen+rankeadaState.erros))*100);
  const tempoSobrou = rankeadaState.tempoRestante;
  const difMult={facil:1,medio:1.5,dificil:2,elite:3}[rankeadaState.dif]||1;
  let pontos=0;
  if (sucesso && alunoAtivo) {
    pontos = Math.max(10, Math.round((wpm*precisao/100+tempoSobrou*0.5)*difMult));
    _digSalvarPontos(pontos);
    if (!alunoAtivo.progresso.rankeada) alunoAtivo.progresso.rankeada=[];
    const idx = alunoAtivo.progresso.rankeada.findIndex(r=>r.id===rankeadaState.texto.id);
    const rec={id:rankeadaState.texto.id,titulo:rankeadaState.texto.titulo,wpm,precisao,pontos,dif:rankeadaState.dif,data:new Date().toISOString()};
    if (idx>=0) { if (wpm>alunoAtivo.progresso.rankeada[idx].wpm) alunoAtivo.progresso.rankeada[idx]=rec; }
    else alunoAtivo.progresso.rankeada.push(rec);
    _digSalvarAluno(alunoAtivo);
  }
  const emoji=sucesso?(wpm>=50?'🚀':wpm>=30?'⚡':'🎉'):'⏰';
  const titulo=sucesso?(wpm>=50?'Incrível!':wpm>=30?'Muito bom!':'Concluído!'):'Tempo esgotado!';
  const txBox = document.getElementById('rankeadaTextoBox');
  if (txBox) txBox.style.opacity='0.35';
  document.getElementById('rankeadaResultado').innerHTML=`
    <div class="dig-completo" style="margin-top:16px;${!sucesso?'background:linear-gradient(135deg,#7F1D1D,#991B1B);':''}">
      <div style="font-size:52px;margin-bottom:8px;">${emoji}</div>
      <div style="font-size:26px;font-weight:800;margin-bottom:8px;">${titulo}</div>
      ${sucesso?`
        <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin:10px 0;font-weight:700;font-size:18px;opacity:0.9;">
          <div>${wpm}<span style="font-size:11px;font-weight:600;display:block;">WPM</span></div>
          <div>${precisao}%<span style="font-size:11px;font-weight:600;display:block;">PRECISÃO</span></div>
          <div>${rankeadaState.erros}<span style="font-size:11px;font-weight:600;display:block;">ERROS</span></div>
          <div>${tempoSobrou}s<span style="font-size:11px;font-weight:600;display:block;">SOBRANDO</span></div>
        </div>
        <div style="font-size:30px;font-weight:900;margin-bottom:16px;">+${pontos} ⭐</div>`
      :`<div style="font-size:14px;opacity:0.85;margin-bottom:16px;">Você digitou ${rankeadaState.pos} de ${textoLen} caracteres (${Math.round(rankeadaState.pos/textoLen*100)}%)</div>`}
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button class="btn ghost" style="background:rgba(255,255,255,0.2);color:white;" onclick="iniciarRankeada('${rankeadaState.texto.id}')">↻ Tentar novamente</button>
        <button class="btn" style="background:white;color:var(--ink);" onclick="abrirMenuRankeada()">← Escolher texto</button>
        <button class="btn" style="background:rgba(0,0,0,0.2);color:white;" onclick="abrirMenuDigitacao()">Menu digitação</button>
      </div>
    </div>`;
}

function sairRankeada() {
  if (rankeadaState.timerId) clearInterval(rankeadaState.timerId);
  document.removeEventListener('keydown', listenerRankeada);
  abrirMenuRankeada();
}

// =============================================================


document.addEventListener('DOMContentLoaded', function() {
  mostrarTela('screen-digitacao-menu');
  abrirMenuDigitacao();
});
