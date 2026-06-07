'use strict';
/* ═══════════════════════════════════════════════════════════════
   HACKER RUNNER — Phaser 3
   Arquitetura: BootScene → StartScene → GameScene → EndScene
   Canvas 1280×720, zoom=1, câmera trava Y em 0 e segue X
═══════════════════════════════════════════════════════════════ */

/* ── Integração com a plataforma ─────────────────────────────── */
function voltarPlataforma() { window.location.href = '../../index.html'; }
function lerAlunoId()        { return new URLSearchParams(window.location.search).get('alunoId')  || ''; }
function lerModuloId()       { return new URLSearchParams(window.location.search).get('moduloId') || 'hardware'; }
function salvarResultadoJogo(score, detalhes) {
  localStorage.setItem('lusca_pending_game_result', JSON.stringify({
    alunoId:   lerAlunoId(),
    moduloId:  lerModuloId(),
    gameId:    'hacker-runner',
    status:    'completed',
    score,
    details:   detalhes || {},
    timestamp: new Date().toISOString(),
  }));
}

/* ── Constantes globais ──────────────────────────────────────── */
const GW   = 1280;   // largura do canvas
const GH   = 720;    // altura do canvas
const GY   = 676;    // topo do chão (94% da altura — ação na parte inferior)
const PH   = 26;     // espessura das plataformas
const WW   = 11200;  // comprimento total do mundo

// Física (referência: yandeu platformer, thedevdojo)
const GRAVITY  = 800;   // px/s²
const JUMP_VY  = -540;  // impulso 1° salto (negativo = para cima)
const JUMP2_VY = -460;  // impulso 2° salto (double jump)
const SPD_N    = 230;   // velocidade normal
const SPD_B    = 350;   // velocidade boost

/* ── Paleta cyberpunk ────────────────────────────────────────── */
const C = {
  sky0:   0x020810,  sky1:   0x071222,  sky2:   0x0D1B30,
  neon:   0x00FFCC,  cyan:   0x00D4AA,  blue:   0x3B8EFF,
  yellow: 0xFFDD57,  red:    0xE33B3B,  orange: 0xFF5500,
  purple: 0x7B2FBE, pink:   0xCC2266,  green:  0x3EBB5A,
  white:  0xFFFFFF,  dark:   0x060E1C,  mid:    0x0C1A2E,
  edge:   0x1A4A88,
};

/* ── Banco de questões ───────────────────────────────────────── */
const QUIZ = [
  { q:'O que define HARDWARE?',
    opts:['Programas instalados no PC','Parte física que podemos tocar','A conexão com a internet'],
    c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'CPU significa:',
    opts:['Central Processing Unit','Computer Power Unit','Control Program Utility'],
    c:0, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'Qual componente guarda dados temporariamente enquanto o PC funciona?',
    opts:['HD (disco rígido)','Placa de vídeo','Memória RAM'],
    c:2, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Teclado é um hardware de:',
    opts:['Saída (mostra resultado)','Entrada (manda dados ao PC)','Processamento'],
    c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'Monitor é um hardware de:',
    opts:['Entrada','Processamento','Saída (exibe resultado)'],
    c:2, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'SSD e HD são dispositivos de:',
    opts:['Processamento','Armazenamento permanente','Entrada de dados'],
    c:1, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Placa-mãe serve para:',
    opts:['Exibir imagens na tela','Conectar todos os componentes','Guardar arquivos'],
    c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'O que é um periférico?',
    opts:['Hardware extra conectado ao PC','Tipo de vírus','Programa de segurança'],
    c:0, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'GPU é responsável por:',
    opts:['Alimentação elétrica','Processamento gráfico','Armazenar dados'],
    c:1, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Fonte de alimentação serve para:',
    opts:['Guardar arquivos','Converter energia elétrica para o PC','Conectar ao Wi-Fi'],
    c:1, item:'double_jump', itemName:'SALTO DUPLO' },
];

/* ── Construção do nível ─────────────────────────────────────── */
function buildLevel() {
  const platforms = [], enemies = [], dataItems = [], firewalls = [];
  const terminals = [], checkpts = [];

  const g  = (x, w)          => platforms.push({ x, y:GY,    w, h:PH, type:'g' });
  const p  = (x, y, w)       => platforms.push({ x, y,       w, h:PH, type:'p' });
  const en = (x, range, fast) => enemies.push({ x, y:GY-19, range, fast:!!fast });
  const d  = (x, y)          => dataItems.push({ x, y: y ?? GY-44 });
  const fw = (x)             => firewalls.push({ x });
  const t  = (x, qi)         => terminals.push({ x, y:GY-64, quizIdx:qi });

  // ── ZONA 0 — Tutorial ────────────────────────────────────────
  g(0, 2200);
  p(360, GY-130, 160); p(590, GY-170, 180); p(850, GY-130, 160);
  p(1100, GY-180, 200); p(1400, GY-140, 160); p(1680, GY-120, 180);

  [160,310].forEach(x=>d(x));
  d(380,GY-130); d(610,GY-170); d(870,GY-130);
  d(1120,GY-180); d(1420,GY-140); d(1700,GY-120);
  d(1900); d(2060);

  en(500,140,false); en(1060,120,false); en(1640,100,false);
  t(880,0); checkpts.push({x:2100});

  // ── ZONA 1 — Servidores ───────────────────────────────────────
  g(2200,500); g(2900,480); g(3580,440); g(4220,400);

  p(2720,GY-150,200); p(3400,GY-160,180); p(4040,GY-150,180);
  p(2300,GY-180,140); p(2480,GY-140,140);
  p(2990,GY-170,150); p(3160,GY-220,130);
  p(3660,GY-160,150); p(3830,GY-210,130);
  p(4300,GY-180,150); p(4470,GY-220,120);

  fw(2390); fw(2510);
  fw(3080); fw(3190);
  fw(3740); fw(3890);

  [2250,2330,2750,2850,3010,3100,3690,3770,4070,4170,4350,4430].forEach(x=>d(x));
  d(2300,GY-180); d(3160,GY-220); d(3830,GY-210); d(4470,GY-220);

  en(2370,150,false); en(3040,130,false); en(3690,110,true); en(4330,120,false);
  t(2880,1); t(3760,2); checkpts.push({x:4540});

  // ── ZONA 2 — Matriz ───────────────────────────────────────────
  g(4620,420); g(5250,380); g(5840,360); g(6440,400);

  p(5040,GY-170,220); p(5640,GY-180,220); p(6240,GY-170,220);
  p(4710,GY-200,140); p(4860,GY-160,130);
  p(5340,GY-220,120); p(5480,GY-180,130);
  p(5940,GY-210,140); p(6090,GY-250,120);
  p(6540,GY-190,140); p(6670,GY-230,120);

  fw(4690); fw(4810); fw(4950);
  fw(5170); fw(5300); fw(5450);
  fw(5870); fw(6010); fw(6150);
  fw(6470); fw(6570); fw(6690);

  [4670,4770,4880,4980,5060,5180,5280,5380,5680,5800,5900,6040,6140,6260,6460,6540].forEach(x=>d(x));
  d(4710,GY-200); d(5340,GY-220); d(5940,GY-210); d(6090,GY-250); d(6670,GY-230);

  en(4710,140,false); en(5110,110,true); en(5300,100,true); en(5790,130,false); en(6480,120,true);
  t(5240,3); t(6200,4); checkpts.push({x:6720});

  // ── ZONA 3 — Firewall Central ─────────────────────────────────
  g(6760,380); g(7370,360); g(8000,340); g(8580,500);

  p(7180,GY-190,220); p(7800,GY-200,220); p(8380,GY-180,200);
  p(6850,GY-220,130); p(6990,GY-260,120);
  p(7490,GY-230,130); p(7630,GY-270,120);
  p(8100,GY-220,130); p(8250,GY-260,120);
  p(8680,GY-200,140); p(8830,GY-240,120);

  [6790,6860,6930].forEach(x=>fw(x));
  [7090,7160,7230].forEach(x=>fw(x));
  [7430,7500,7570].forEach(x=>fw(x));
  [8040,8110,8180].forEach(x=>fw(x));
  [8420,8490,8560].forEach(x=>fw(x));
  [8640,8710,8780,8850].forEach(x=>fw(x));

  [6770,6850,6920,7200,7300,7430,7550,7820,7920,8040,8280,8420,8520,8620,8740,8840].forEach(x=>d(x));
  d(6990,GY-260); d(7630,GY-270); d(8250,GY-260); d(8830,GY-240);

  en(6810,120,true); en(7090,110,false); en(7430,100,true);
  en(7940,90,true);  en(8620,110,true);  en(8780,90,true);

  t(7360,5); t(8580,6); checkpts.push({x:8900});

  // ── ZONA 4 — PC Central (gauntlet) ────────────────────────────
  g(8960,360); g(9590,340); g(10180,340); g(10680,300);

  p(9310,GY-200,240); p(9920,GY-210,240); p(10530,GY-190,160);
  p(9040,GY-230,130); p(9180,GY-270,120);
  p(9640,GY-240,130); p(9780,GY-280,120);
  p(10240,GY-230,130); p(10380,GY-270,120);
  p(10740,GY-210,140);

  [8980,9060,9140,9220].forEach(x=>fw(x));
  [9360,9440,9520,9600].forEach(x=>fw(x));
  [9960,10040,10120,10200].forEach(x=>fw(x));
  [10420,10500,10580,10660].forEach(x=>fw(x));

  [8980,9060,9160,9340,9440,9540,9640,9740,9960,10040,10140,10240,10460,10560,10660,10740].forEach(x=>d(x));
  d(9180,GY-270); d(9780,GY-280); d(10380,GY-270);

  en(9040,90,true); en(9240,80,true); en(9640,100,true);
  en(9840,90,true); en(10240,80,true); en(10460,100,true);

  t(9580,7); t(10160,8); checkpts.push({x:10620});

  return {
    platforms, enemies, dataItems, firewalls, terminals, checkpts,
    playerStart: { x:80, y:GY-80 },
    goalX: 10740, goalY: GY-160,
    totalData: dataItems.length,
  };
}

/* ═══════════════════════════════════════════════════════════════
   BootScene — pré-carregamento mínimo
═══════════════════════════════════════════════════════════════ */
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() { this.scene.start('StartScene'); }
}

/* ═══════════════════════════════════════════════════════════════
   StartScene — tela de título
═══════════════════════════════════════════════════════════════ */
class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  create() {
    const cx = GW / 2, cy = GH / 2;

    // Fundo com gradiente
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.sky0, C.sky0, C.sky1, C.sky1, 1);
    bg.fillRect(0, 0, GW, GH);

    // Estrelas
    this._drawStars(bg);

    // Prédios decorativos
    this._drawCityBg(bg);

    // Chão
    bg.fillStyle(C.mid, 1); bg.fillRect(0, GY+PH, GW, GH-(GY+PH));
    bg.fillStyle(C.neon, 0.3); bg.fillRect(0, GY, GW, 2);

    // Painel central translúcido
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.7); panel.fillRoundedRect(cx-360, cy-260, 720, 520, 16);
    panel.lineStyle(2, C.neon, 0.6); panel.strokeRoundedRect(cx-360, cy-260, 720, 520, 16);
    panel.lineStyle(1, C.neon, 0.15); panel.strokeRoundedRect(cx-356, cy-256, 712, 512, 14);

    // Título
    this.add.text(cx, cy-210, 'MÓDULO HARDWARE', {
      fontFamily:'monospace', fontSize:'13px', color:'#3EBB5A', letterSpacing:5,
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy-155, 'HACKER RUNNER', {
      fontFamily:'monospace', fontSize:'62px', fontStyle:'bold',
      color:'#00FFCC', stroke:'#001A11', strokeThickness:6,
    }).setOrigin(0.5);
    this.tweens.add({ targets:title, alpha:{from:1,to:0.8}, duration:1600, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

    // Subtítulo
    this.add.text(cx, cy-85, '5 ZONAS · INFILTRE A REDE · ALCANCE O PC CENTRAL', {
      fontFamily:'monospace', fontSize:'12px', color:'#3B8EFF', letterSpacing:2,
    }).setOrigin(0.5);

    // Controles
    const ctrlData = [
      ['← →  /  A D', 'MOVER'],
      ['ESPAÇO / ↑ / W', 'PULAR'],
      ['↑ perto do terminal', 'ACESSAR QUIZ (opcional)'],
    ];
    ctrlData.forEach(([key, act], i) => {
      const row = cy - 30 + i * 34;
      this.add.text(cx - 200, row, key, {
        fontFamily:'monospace', fontSize:'12px', color:'#FFDD57',
      }).setOrigin(0, 0.5);
      this.add.text(cx - 30, row, '—', {
        fontFamily:'monospace', fontSize:'12px', color:'#444D56',
      }).setOrigin(0, 0.5);
      this.add.text(cx + 10, row, act, {
        fontFamily:'monospace', fontSize:'12px', color:'#C9D1D9',
      }).setOrigin(0, 0.5);
    });

    this.add.text(cx, cy+90, 'Terminais espalhados pelo nível oferecem power-ups — são OPCIONAIS!', {
      fontFamily:'monospace', fontSize:'11px', color:'#8B949E',
    }).setOrigin(0.5);

    // Botão iniciar
    this._btn(cx, cy + 150, 'INICIAR MISSÃO', C.neon, 0x003B22, () => this.scene.start('GameScene'));

    // Botão voltar
    const vol = this.add.text(cx, cy + 210, '← VOLTAR À PLATAFORMA', {
      fontFamily:'monospace', fontSize:'12px', color:'#555D68',
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    vol.on('pointerover', () => vol.setColor('#C9D1D9'));
    vol.on('pointerout',  () => vol.setColor('#555D68'));
    vol.on('pointerdown', () => voltarPlataforma());
  }

  _drawStars(g) {
    const rng = new Phaser.Math.RandomDataGenerator(['stars_seed_42']);
    for (let i = 0; i < 140; i++) {
      const sx = rng.integerInRange(0, GW);
      const sy = rng.integerInRange(0, GH * 0.72);
      const sz = rng.integerInRange(1, 3);
      const alpha = rng.realInRange(0.3, 0.9);
      const col = rng.pick([0xFFFFFF, 0xAADDFF, 0x88CCFF, 0xCCFFFF]);
      g.fillStyle(col, alpha);
      g.fillRect(sx, sy, sz === 3 ? 2 : 1, sz === 3 ? 2 : 1);
    }
  }

  _drawCityBg(g) {
    const sizes = [18,80, 24,110, 14,70, 30,130, 20,90, 16,65, 26,120, 22,85,
                   12,50, 28,140, 18,75, 24,95, 14,60, 20,100, 16,72, 22,88];
    let bx = 40;
    for (let i = 0; i < sizes.length; i += 2) {
      const bw = sizes[i], bh = sizes[i+1];
      const by = GY + PH - bh;
      g.fillStyle(0x060D1C, 0.9); g.fillRect(bx, by, bw, bh);
      g.fillStyle(C.edge, 0.15); g.fillRect(bx, by, 1, bh); g.fillRect(bx+bw-1, by, 1, bh);
      // Janelas
      for (let wy = by+6; wy < by+bh-6; wy += 10) {
        for (let wx = bx+3; wx < bx+bw-3; wx += 6) {
          const lit = Math.random() > 0.55;
          if (lit) {
            const wc = Math.random() > 0.7 ? 0xFFDD88 : (Math.random() > 0.5 ? 0x88AAFF : 0x44CCAA);
            g.fillStyle(wc, 0.6 + Math.random() * 0.3);
            g.fillRect(wx, wy, 3, 5);
          }
        }
      }
      bx += bw + Phaser.Math.Between(8, 20);
      if (bx > GW + 100) break;
    }
  }

  _btn(x, y, label, textCol, bgCol, cb) {
    const w = 260, h = 46;
    const r = this.add.rectangle(x, y, w, h, bgCol, 1).setStrokeStyle(2, textCol).setInteractive({useHandCursor:true});
    const t = this.add.text(x, y, label, { fontFamily:'monospace', fontSize:'16px', fontStyle:'bold',
      color:'#' + textCol.toString(16).padStart(6,'0') }).setOrigin(0.5);
    r.on('pointerover',  () => r.setFillStyle(textCol, 0.2));
    r.on('pointerout',   () => r.setFillStyle(bgCol, 1));
    r.on('pointerdown',  cb);
    t.setInteractive({useHandCursor:true});
    t.on('pointerover',  () => r.setFillStyle(textCol, 0.2));
    t.on('pointerout',   () => r.setFillStyle(bgCol, 1));
    t.on('pointerdown',  cb);
  }
}

/* ═══════════════════════════════════════════════════════════════
   GameScene — cena principal
   Câmera: zoom=1, Y travado em 0, X suave atrás do jogador
═══════════════════════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Estado
    this.score        = 0;
    this.energy       = 5;
    this.invincible   = 0;
    this.extraJumps   = 0;
    this.wasGround    = false;
    this.coyoteTime   = 0;
    this.gameOver     = false;
    this.won          = false;
    this.quizOpen     = false;
    this.items        = { double_jump:false, speed:false, shield:false };
    this.flashTimer   = 0;
    this.flashTxt     = '';
    this.flashCol     = '#00FFCC';
    this.lastCpX      = 80;
    this.lastCpY      = GY - 80;
    this.zoneShown    = -1;
    this.dataCount    = 0;
    this.deaths       = 0;
    this.startTime    = Date.now();
    this.usedTerminals = new Set();
    this._prevMobJump = false;

    const LVL = buildLevel();
    this.LVL = LVL;

    // Física — mundo maior em Y para a morte por queda
    this.physics.world.setBounds(0, 0, WW, GH + 400);
    this.physics.world.gravity.y = GRAVITY;

    // Câmera: sem zoom, segue apenas X, Y travado em 0
    this.cameras.main.setBounds(0, 0, WW, GH);
    this._camTargetX = 80;

    // ── Construção do mundo ──
    this._buildBackground();
    this._createTextures();
    this._buildTilemap(LVL);
    this._buildCollectibles(LVL);
    this._buildEnemies(LVL);
    this._buildPlayer(LVL);
    this._buildGoal(LVL);

    // ── Colisores ──
    this.physics.add.collider(this.player, this.platforms, null, this._platProcess, this);

    // ── Controles ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.mobileL = false; this.mobileR = false; this.mobileJ = false;
    this._setupMobile();

    // ── HUD ──
    this._buildHUD();

    // ── Quiz UI ──
    this._buildQuizUI();

    // ── Toast de zona ──
    this.zoneToast = this.add.text(GW/2, GH/2 - 50, '', {
      fontFamily:'monospace', fontSize:'22px', fontStyle:'bold',
      color:'#00FFCC', stroke:'#001A11', strokeThickness:4,
    }).setScrollFactor(0).setDepth(30).setOrigin(0.5).setAlpha(0);

    this._showZoneToast(0);
  }

  // ── Plataformas one-way (só pousa vindo de cima) ──
  _platProcess(player, plat) {
    if (plat.getData('type') !== 'p') return true;
    return player.body.velocity.y >= 0 &&
           Math.round(player.body.bottom - player.body.velocity.y * (1/60)) <= plat.body.top + 14;
  }

  /* ── Texturas geradas proceduralmente ──────────────────────── */
  _createTextures() {
    const tex = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const g = this.add.graphics();
      fn(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Chão (64×20) — placa de circuito
    tex('tex_ground', 64, PH, g => {
      g.fillStyle(0x061220, 1); g.fillRect(0, 0, 64, PH);
      g.fillStyle(0x0C2040, 1); g.fillRect(0, 2, 64, PH-2);
      // Topo brilhante
      g.fillStyle(C.neon, 0.9); g.fillRect(0, 0, 64, 2);
      g.fillStyle(C.neon, 0.3); g.fillRect(0, 2, 64, 1);
      // Linhas de circuito
      g.fillStyle(0x1A4060, 0.9);
      g.fillRect(6, 6, 52, 1); g.fillRect(6, 12, 52, 1);
      g.fillRect(6, 6, 1, 7); g.fillRect(30, 6, 1, 7); g.fillRect(58, 6, 1, 7);
      // LEDs
      g.fillStyle(C.neon, 0.8); g.fillRect(10, 4, 3, 3);
      g.fillStyle(C.blue, 0.8); g.fillRect(35, 4, 3, 3);
      g.fillStyle(C.green, 0.8); g.fillRect(57, 4, 3, 3);
    });

    // Plataforma (64×20) — painel metálico
    tex('tex_plat', 64, PH, g => {
      g.fillStyle(0x0D1E34, 1); g.fillRect(0, 0, 64, PH);
      g.fillStyle(0x142840, 1); g.fillRect(1, 2, 62, PH-2);
      // Topo neon
      g.fillStyle(C.blue, 1); g.fillRect(0, 0, 64, 2);
      g.fillStyle(C.neon, 0.5); g.fillRect(2, 0, 60, 1);
      // Detalhes
      g.fillStyle(0x0A1628, 0.8); g.fillRect(4, 5, 56, 2); g.fillRect(4, 10, 56, 2);
      // Indicadores
      g.fillStyle(C.green, 1); g.fillRect(2, 5, 4, 4);
      g.fillStyle(C.blue, 0.9); g.fillRect(56, 5, 4, 4);
    });

    // Firewall (26×80) — barreira digital imponente
    tex('tex_fw', 26, 80, g => {
      // Glow externo alaranjado-vermelho
      g.fillStyle(0xFF2200, 0.25); g.fillRect(0, 0, 26, 80);
      g.fillStyle(0xFF1100, 0.15); g.fillRect(1, 0, 24, 80);
      // Corpo base
      g.fillStyle(0x990A00, 1); g.fillRect(3, 0, 20, 80);
      g.fillStyle(0xBB1100, 1); g.fillRect(4, 0, 18, 80);
      // Listras de perigo preto/amarelo alternadas
      for (let y = 0; y < 80; y += 10) {
        g.fillStyle(y % 20 === 0 ? 0xFFAA00 : 0x550000, 0.55);
        g.fillRect(4, y, 18, 5);
      }
      // Colunas de energia nas bordas
      g.fillStyle(0xFF3300, 1); g.fillRect(3, 0, 3, 80); g.fillRect(20, 0, 3, 80);
      g.fillStyle(0xFF6600, 0.8); g.fillRect(4, 0, 2, 80); g.fillRect(20, 0, 2, 80);
      // Brilho central pulsante (streak)
      g.fillStyle(0xFF6600, 0.3); g.fillRect(12, 0, 2, 80);
      // Pixel skull / símbolo de aviso no centro
      g.fillStyle(0xFFDD00, 1);
      // Triângulo ▲ feito de pixels
      g.fillRect(12, 20, 2, 2);
      g.fillRect(10, 22, 6, 2);
      g.fillRect(8, 24, 10, 2);
      g.fillRect(7, 26, 12, 2);
      g.fillRect(7, 28, 12, 3);
      // Olhos do símbolo
      g.fillStyle(0x990A00, 1); g.fillRect(9, 28, 3, 2); g.fillRect(14, 28, 3, 2);
      // Barra inferior "FW"
      g.fillStyle(0xFF4400, 1); g.fillRect(4, 52, 18, 2);
      g.fillStyle(0xFFCC00, 1);
      g.fillRect(6, 56, 6, 2); g.fillRect(6, 58, 2, 6); g.fillRect(6, 61, 5, 2);
      g.fillRect(14, 56, 2, 8); g.fillRect(16, 56, 2, 2); g.fillRect(16, 60, 2, 2); g.fillRect(18, 56, 2, 4);
      // Topo com indicador vermelho piscante (estático)
      g.fillStyle(0xFF0000, 1); g.fillRect(11, 2, 4, 4);
      g.fillStyle(0xFFAAAA, 0.8); g.fillRect(12, 3, 2, 2);
    });

    // Dado coletável (24×24) — cristal ciano brilhante
    tex('tex_data', 24, 24, g => {
      // Aura exterior
      g.fillStyle(C.neon, 0.2); g.fillRect(0, 0, 24, 24);
      g.fillStyle(C.neon, 0.12); g.fillCircle(12, 12, 10);
      // Forma de diamante (maior e mais vistosa)
      g.fillStyle(0x00BBAA, 1);
      g.fillRect(10, 1, 4, 2); g.fillRect(8, 3, 8, 2); g.fillRect(6, 5, 12, 2);
      g.fillRect(4, 7, 16, 3); g.fillRect(3, 10, 18, 4);
      g.fillRect(4, 14, 16, 3); g.fillRect(6, 17, 12, 2);
      g.fillRect(8, 19, 8, 2); g.fillRect(10, 21, 4, 2);
      // Camada interna mais clara
      g.fillStyle(C.neon, 0.9);
      g.fillRect(9, 4, 6, 2); g.fillRect(7, 6, 10, 2);
      g.fillRect(6, 8, 12, 3); g.fillRect(6, 11, 12, 2);
      g.fillRect(7, 13, 10, 2); g.fillRect(9, 15, 6, 2);
      // Reflexo/brilho
      g.fillStyle(0xCCFFFF, 0.9); g.fillRect(9, 7, 5, 4);
      g.fillStyle(0xFFFFFF, 1); g.fillRect(10, 8, 2, 2);
      // Ponto de brilho canto
      g.fillStyle(0xFFFFFF, 0.7); g.fillRect(15, 6, 2, 2);
    });

    // Terminal (38×64)
    tex('tex_terminal', 38, 64, g => {
      // Estrutura
      g.fillStyle(0x091625, 1); g.fillRect(0, 10, 38, 54);
      g.fillStyle(0x101E30, 1); g.fillRect(1, 11, 36, 52);
      g.fillStyle(C.edge, 0.5); g.fillRect(0, 10, 38, 2);
      // Tela
      g.fillStyle(0x00AA77, 1); g.fillRect(4, 15, 30, 26);
      g.fillStyle(0x000000, 0.25);
      for (let y=15; y<41; y+=3) g.fillRect(4, y, 30, 1);
      // Texto na tela
      g.fillStyle(0xFFFFFF, 0.9); g.fillRect(6, 18, 5, 3); g.fillRect(6, 24, 18, 2);
      g.fillStyle(0x00FF88, 1); g.fillRect(6, 30, 10, 2);
      // LED piscando
      g.fillStyle(C.green, 1); g.fillRect(32, 15, 4, 4);
      // Teclado
      g.fillStyle(0x060F1C, 1); g.fillRect(2, 47, 34, 14);
      for (let kx=4; kx<32; kx+=6) { g.fillStyle(0x1A3050, 1); g.fillRect(kx, 49, 4, 4); }
      for (let kx=4; kx<32; kx+=6) { g.fillStyle(0x1A3050, 1); g.fillRect(kx, 55, 4, 4); }
      // Prompt ativo
      g.fillStyle(0x00FF88, 1); g.fillRect(6, 38, 2, 5);
    });

    // Checkpoint desativado (28×44)
    tex('tex_cp_off', 28, 44, g => {
      g.fillStyle(0x444D56, 1); g.fillRect(8, 0, 4, 44);
      g.fillStyle(0x586069, 1); g.fillRect(12, 0, 16, 14); g.fillRect(12, 0, 16, 14);
      g.fillStyle(0x30363D, 1); g.fillRect(13, 1, 14, 12);
    });

    // Checkpoint ativado (28×44)
    tex('tex_cp_on', 28, 44, g => {
      g.fillStyle(C.green, 1); g.fillRect(8, 0, 4, 44);
      g.fillStyle(0x56D364, 1); g.fillRect(12, 0, 16, 14);
      g.fillStyle(0xCEFFC9, 1); g.fillRect(13, 1, 14, 12);
      g.fillStyle(C.green, 0.2); g.fillRect(0, 0, 28, 44);
    });

    // Jogador (40×62) — hacker icônico com hoodie e visor largo
    tex('tex_player', 40, 62, g => {
      // Pernas
      g.fillStyle(0x111E30, 1);
      g.fillRect(8, 42, 10, 17); g.fillRect(22, 42, 10, 17);
      // Tênis
      g.fillStyle(C.neon, 1); g.fillRect(22, 57, 12, 4);
      g.fillStyle(0x007755, 1); g.fillRect(6, 57, 11, 4);
      // Detalhe joelho
      g.fillStyle(0x1A2E48, 1); g.fillRect(8, 47, 10, 4); g.fillRect(22, 47, 10, 4);
      // Corpo
      g.fillStyle(0x101C2E, 1); g.fillRect(5, 22, 30, 22);
      g.fillStyle(0x172438, 1); g.fillRect(6, 23, 28, 20);
      // Listras laterais neon
      g.fillStyle(C.neon, 0.9); g.fillRect(5, 23, 2, 18); g.fillRect(33, 23, 2, 18);
      // Logo no peito (diamante pequeno)
      g.fillStyle(C.neon, 0.7); g.fillRect(18, 29, 4, 2); g.fillRect(16, 31, 8, 2); g.fillRect(18, 33, 4, 2);
      // Cinto
      g.fillStyle(C.neon, 0.5); g.fillRect(5, 41, 30, 2);
      // Braço esquerdo
      g.fillStyle(0x101C2E, 1); g.fillRect(0, 23, 5, 14);
      g.fillStyle(C.neon, 0.6); g.fillRect(0, 23, 2, 14);
      // Mochila / datapack nas costas
      g.fillStyle(0x07101C, 1); g.fillRect(1, 20, 5, 18);
      g.fillStyle(C.blue, 0.9); g.fillRect(1, 21, 5, 5);
      g.fillStyle(C.neon, 0.5); g.fillRect(1, 29, 5, 3); g.fillRect(1, 34, 5, 2);
      // Capuz — grande e dramático
      g.fillStyle(0x0C1828, 1); g.fillRect(4, 4, 32, 20);
      g.fillStyle(0x152030, 1); g.fillRect(5, 5, 30, 18);
      // Borda do capuz com neon sutil
      g.fillStyle(C.neon, 0.35); g.fillRect(4, 4, 32, 1);
      g.fillStyle(C.neon, 0.15); g.fillRect(4, 5, 1, 18); g.fillRect(35, 5, 1, 18);
      // VISOR — elemento mais icônico, largo e brilhante
      g.fillStyle(0x003B77, 1); g.fillRect(6, 9, 28, 11);
      g.fillStyle(0x0055AA, 1); g.fillRect(6, 9, 28, 5);
      g.fillStyle(0x0088DD, 1); g.fillRect(6, 9, 28, 3);
      // Brilho/reflexo no visor
      g.fillStyle(0xFFFFFF, 0.55); g.fillRect(7, 10, 9, 3);
      g.fillStyle(0xFFFFFF, 0.25); g.fillRect(18, 10, 5, 2);
      // Glow neon externo do visor
      g.fillStyle(C.neon, 0.22); g.fillRect(5, 8, 30, 13);
      // Borda neon do visor
      g.fillStyle(C.neon, 0.8); g.fillRect(6, 9, 28, 1); g.fillRect(6, 19, 28, 1);
      // Scanline no visor
      g.fillStyle(0x000000, 0.2); g.fillRect(6, 12, 28, 1); g.fillRect(6, 15, 28, 1);
    });

    // Inimigo lento (36×38) — vírus roxo grande e ameaçador
    tex('tex_enemy_slow', 36, 38, g => {
      // Aura de glitch
      g.fillStyle(0x4400AA, 0.18); g.fillRect(0, 2, 36, 34);
      // Corpo hexagonal
      g.fillStyle(0x3D0E88, 1);
      g.fillRect(5, 10, 26, 18); g.fillRect(8, 6, 20, 26);
      g.fillStyle(0x6820C0, 1);
      g.fillRect(6, 11, 24, 16); g.fillRect(9, 7, 18, 24);
      // Camada interna mais clara
      g.fillStyle(0x8030D8, 1); g.fillRect(10, 12, 16, 12);
      // Espinhos — longos e intimidadores
      g.fillStyle(0xAA44EE, 1);
      g.fillRect(0, 12, 5, 4); g.fillRect(0, 18, 5, 4);
      g.fillRect(31, 12, 5, 4); g.fillRect(31, 18, 5, 4);
      g.fillRect(10, 0, 5, 6); g.fillRect(17, 0, 4, 5); g.fillRect(22, 0, 5, 6);
      g.fillRect(10, 32, 4, 6); g.fillRect(22, 32, 4, 6);
      // Olhos — vermelhos e grandes
      g.fillStyle(0xFF1111, 1); g.fillRect(9, 13, 8, 8); g.fillRect(19, 13, 8, 8);
      g.fillStyle(0xFF6666, 1); g.fillRect(10, 14, 4, 4); g.fillRect(20, 14, 4, 4);
      g.fillStyle(0xFFEEEE, 1); g.fillRect(10, 14, 2, 2); g.fillRect(20, 14, 2, 2);
      // Sobrancelha maligna
      g.fillStyle(0x220055, 1); g.fillRect(9, 12, 8, 2); g.fillRect(19, 12, 8, 2);
      // Boca ameaçadora
      g.fillStyle(0xFF1111, 0.8); g.fillRect(11, 23, 14, 3);
      g.fillStyle(0xFFFFFF, 1); g.fillRect(12, 23, 2, 3); g.fillRect(16, 23, 2, 3); g.fillRect(20, 23, 2, 3);
    });

    // Inimigo rápido (36×38) — vírus rosa-magenta ágil com design mais angular
    tex('tex_enemy_fast', 36, 38, g => {
      g.fillStyle(0x660020, 0.18); g.fillRect(0, 2, 36, 34);
      // Corpo angular (losango achatado)
      g.fillStyle(0x880030, 1);
      g.fillRect(5, 10, 26, 18); g.fillRect(8, 6, 20, 26);
      g.fillStyle(0xCC1155, 1);
      g.fillRect(6, 11, 24, 16); g.fillRect(9, 7, 18, 24);
      g.fillStyle(0xEE2277, 1); g.fillRect(10, 12, 16, 12);
      // Espinhos mais longos (sugere velocidade)
      g.fillStyle(0xFF3399, 1);
      g.fillRect(0, 10, 5, 4); g.fillRect(0, 16, 5, 4); g.fillRect(0, 22, 5, 4);
      g.fillRect(31, 10, 5, 4); g.fillRect(31, 16, 5, 4); g.fillRect(31, 22, 5, 4);
      g.fillRect(9, 0, 4, 7); g.fillRect(15, 0, 3, 6); g.fillRect(21, 0, 4, 7); g.fillRect(24, 0, 4, 5);
      g.fillRect(10, 31, 3, 7); g.fillRect(23, 31, 3, 7);
      // Olhos laranja brilhante
      g.fillStyle(0xFF5500, 1); g.fillRect(9, 13, 8, 8); g.fillRect(19, 13, 8, 8);
      g.fillStyle(0xFF9922, 1); g.fillRect(10, 14, 4, 4); g.fillRect(20, 14, 4, 4);
      g.fillStyle(0xFFFFCC, 1); g.fillRect(10, 14, 2, 2); g.fillRect(20, 14, 2, 2);
      g.fillStyle(0x330000, 1); g.fillRect(9, 12, 8, 2); g.fillRect(19, 12, 8, 2);
      // Boca com dentes afiados
      g.fillStyle(0xFF3300, 0.9); g.fillRect(11, 23, 14, 3);
      g.fillStyle(0xFFFFFF, 1); g.fillRect(11, 23, 2, 3); g.fillRect(14, 23, 2, 3); g.fillRect(17, 23, 2, 3); g.fillRect(20, 23, 2, 3); g.fillRect(23, 23, 2, 3);
    });
  }

  /* ── Fundo em camadas parallax ──────────────────────────────── */
  _buildBackground() {
    // Gradiente do céu — vai de quase-preto no topo a azul-noite na base
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-20);
    sky.fillGradientStyle(0x010408, 0x010408, 0x071830, 0x071830, 1);
    sky.fillRect(0, 0, GW, GH);

    // Estrelas fixas na tela
    this._drawBgStars(sky);

    // Lua / astro decorativo
    sky.fillStyle(0xAADDFF, 0.12); sky.fillCircle(GW * 0.82, 80, 48);
    sky.fillStyle(0xCCEEFF, 0.07); sky.fillCircle(GW * 0.82, 80, 62);
    sky.fillStyle(0xEEF8FF, 0.28); sky.fillCircle(GW * 0.82, 80, 28);

    // Nebulosa — brilho suave atrás dos prédios
    sky.fillStyle(0x0033AA, 0.07); sky.fillEllipse(GW * 0.3, 200, 500, 250);
    sky.fillStyle(0x440088, 0.05); sky.fillEllipse(GW * 0.7, 160, 400, 200);

    // Camada 1 — megaestruturas no fundo (scrollFactor=0.05 — quase estáticas)
    const far = this.add.graphics().setScrollFactor(0.05).setDepth(-19);
    this._drawSkyscrapers(far, 'far', 0x020608, 0.95, 0.18, 240, 560);

    // Camada 2 — prédios médios distantes (scrollFactor=0.15)
    const mid1 = this.add.graphics().setScrollFactor(0.15).setDepth(-18);
    this._drawSkyscrapers(mid1, 'mid1', 0x030A14, 0.95, 0.3, 120, 380);

    // Antenas e torres de comunicação (scrollFactor=0.15)
    this._drawAntennas(mid1, 0x030A14);

    // Camada 3 — prédios próximos (scrollFactor=0.35)
    const near = this.add.graphics().setScrollFactor(0.35).setDepth(-17);
    this._drawSkyscrapers(near, 'near', 0x050E1C, 0.98, 0.55, 60, 220);

    // Detalhes neon nos prédios próximos (letreiros, hologramas)
    this._drawNeonSigns(near);

    // Linhas de horizonte de smog luminoso
    const haze = this.add.graphics().setScrollFactor(0).setDepth(-16);
    haze.fillGradientStyle(0x000000, 0x000000, 0x0A2040, 0x0A2040, 0);
    haze.fillRect(0, GY - 180, GW, 180);
    haze.lineStyle(1, C.neon, 0.06); haze.lineBetween(0, GY - 2, GW, GY - 2);

    // Chão
    const floor = this.add.graphics().setDepth(-14);
    floor.fillStyle(0x040B14, 1);
    floor.fillRect(0, GY + PH, WW, GH - (GY + PH));
    floor.lineStyle(1, C.neon, 0.1);
    for (let x = 0; x < WW; x += 160) floor.lineBetween(x, GY + PH, x, GH);
    floor.lineStyle(1, C.neon, 0.05);
    floor.lineBetween(0, GY + PH + 20, WW, GY + PH + 20);
    floor.lineBetween(0, GY + PH + 44, WW, GY + PH + 44);
  }

  _drawBgStars(g) {
    const rng = new Phaser.Math.RandomDataGenerator(['bg_stars_v2']);
    for (let i = 0; i < 200; i++) {
      const sx = rng.integerInRange(0, GW);
      const sy = rng.integerInRange(0, Math.floor(GH * 0.65));
      const bright = rng.realInRange(0.2, 0.85);
      const col = rng.pick([0xFFFFFF, 0xBBDDFF, 0x88BBFF, 0xCCFFFF, 0xFFEEEE]);
      g.fillStyle(col, bright);
      g.fillRect(sx, sy, 1, 1);
    }
    for (let i = 0; i < 12; i++) {
      const sx = rng.integerInRange(0, GW);
      const sy = rng.integerInRange(0, Math.floor(GH * 0.55));
      g.fillStyle(0xFFFFFF, 0.95); g.fillRect(sx, sy, 2, 2);
      g.fillStyle(0xAADDFF, 0.25); g.fillRect(sx-1, sy-1, 4, 4);
    }
  }

  _drawSkyscrapers(g, seed, col, bodyAlpha, winAlpha, minH, maxH) {
    const rng = new Phaser.Math.RandomDataGenerator(['sky_' + seed]);
    let bx = 0;
    const worldW = WW * (seed === 'far' ? 0.12 : seed === 'mid1' ? 0.25 : 0.5);
    while (bx < worldW + 400) {
      const bw = rng.integerInRange(30, 90);
      const bh = rng.integerInRange(minH, maxH);
      const by = GY - bh;
      // Corpo principal
      g.fillStyle(col, bodyAlpha); g.fillRect(bx, by, bw, bh + PH);
      // Bordas sutis de brilho neon azul
      g.fillStyle(0x1155AA, 0.18); g.fillRect(bx, by, 1, bh); g.fillRect(bx+bw-1, by, 1, bh);
      g.fillStyle(0x1155AA, 0.08); g.fillRect(bx, by, bw, 1);
      // Setback (recuo no topo)
      if (bw > 50 && rng.frac() > 0.4) {
        const sw = rng.integerInRange(12, bw-10);
        const sx = bx + rng.integerInRange(0, bw-sw);
        const sh = rng.integerInRange(30, 80);
        g.fillStyle(col, bodyAlpha); g.fillRect(sx, by - sh, sw, sh);
        g.fillStyle(0x1155AA, 0.15); g.fillRect(sx, by-sh, 1, sh); g.fillRect(sx+sw-1, by-sh, 1, sh);
      }
      // Janelas em grade
      const wStep = 7, wH = 5;
      for (let wy = by + 10; wy < by + bh - 8; wy += wH + 4) {
        for (let wx = bx + 4; wx < bx + bw - 4; wx += wStep) {
          if (rng.frac() < (winAlpha > 0.4 ? 0.65 : 0.5)) {
            const wc = rng.pick([0xFFEE88, 0x88AAFF, 0x44DDBB, 0xFF9955, 0xCCBBFF]);
            g.fillStyle(wc, winAlpha * rng.realInRange(0.5, 1.0));
            g.fillRect(wx, wy, 4, wH);
          }
        }
      }
      // Linha de topo neon
      const topCol = rng.pick([C.neon, C.blue, 0x9933FF, 0xFF3388]);
      g.fillStyle(topCol, 0.4 + rng.frac() * 0.4); g.fillRect(bx, by, bw, 1);
      bx += bw + rng.integerInRange(3, 18);
    }
  }

  _drawAntennas(g, col) {
    const rng = new Phaser.Math.RandomDataGenerator(['ant']);
    let bx = 80;
    while (bx < WW * 0.25) {
      if (rng.frac() > 0.5) {
        const h = rng.integerInRange(40, 110);
        const by = GY - rng.integerInRange(120, 380) - h;
        g.fillStyle(0x223344, 0.8); g.fillRect(bx, by, 3, h);
        // Blink red light
        g.fillStyle(0xFF2222, 0.7); g.fillRect(bx, by, 5, 4);
        // Braço lateral
        if (rng.frac() > 0.5) {
          const armL = rng.integerInRange(12, 28);
          g.fillStyle(0x223344, 0.7); g.fillRect(bx - armL, by + rng.integerInRange(8, h/2), armL, 2);
        }
      }
      bx += rng.integerInRange(60, 200);
    }
  }

  _drawNeonSigns(g) {
    const rng = new Phaser.Math.RandomDataGenerator(['signs']);
    const colors = [C.neon, 0xFF3388, 0x9933FF, C.blue, 0xFF6600];
    let bx = 100;
    while (bx < WW * 0.6) {
      if (rng.frac() > 0.6) {
        const sy = rng.integerInRange(GY - 300, GY - 100);
        const sw = rng.integerInRange(20, 60);
        const sh = rng.integerInRange(6, 14);
        const nc = rng.pick(colors);
        g.fillStyle(nc, rng.realInRange(0.12, 0.35)); g.fillRect(bx, sy, sw, sh);
        g.lineStyle(1, nc, rng.realInRange(0.5, 0.85)); g.strokeRect(bx, sy, sw, sh);
        // Pixel art text placeholder (bar lines)
        g.fillStyle(nc, 0.7);
        for (let i = 3; i < sw - 3; i += 5) g.fillRect(bx + i, sy + 2, 3, sh - 4);
      }
      bx += rng.integerInRange(80, 300);
    }
  }

  /* ── Tilemap / plataformas ──────────────────────────────────── */
  _buildTilemap(LVL) {
    this.platforms = this.physics.add.staticGroup();
    for (const pl of LVL.platforms) {
      const key = pl.type === 'g' ? 'tex_ground' : 'tex_plat';
      const spr = this.platforms.create(pl.x + pl.w/2, pl.y + pl.h/2, key);
      spr.setDisplaySize(pl.w, pl.h);
      spr.body.setSize(pl.w, pl.h);
      spr.refreshBody();
      spr.setData('type', pl.type);
    }

    this.fwGroup = this.physics.add.staticGroup();
    for (const fw of LVL.firewalls) {
      const spr = this.fwGroup.create(fw.x + 11, GY - 36, 'tex_fw');
      spr.body.setSize(22, 72);
      spr.refreshBody();
    }

    this.termGroup = this.physics.add.staticGroup();
    LVL.terminals.forEach((t, i) => {
      const spr = this.termGroup.create(t.x + 19, t.y + 32, 'tex_terminal');
      spr.setData('quizIdx', t.quizIdx);
      spr.setData('idx', i);
      spr.body.setSize(38, 64);
      spr.refreshBody();
    });

    this.cpGroup = this.physics.add.staticGroup();
    for (const cp of LVL.checkpts) {
      const spr = this.cpGroup.create(cp.x + 14, GY - 22, 'tex_cp_off');
      spr.setData('activated', false);
      spr.setData('ox', cp.x);
      spr.body.setSize(28, 44);
      spr.refreshBody();
    }
  }

  /* ── Coletáveis ─────────────────────────────────────────────── */
  _buildCollectibles(LVL) {
    this.dataGroup = this.physics.add.staticGroup();
    for (const d of LVL.dataItems) {
      const spr = this.dataGroup.create(d.x, d.y, 'tex_data');
      spr.setData('t', Math.random() * Math.PI * 2);
      spr.body.setSize(18, 18);
      spr.refreshBody();
    }
  }

  /* ── Inimigos ───────────────────────────────────────────────── */
  _buildEnemies(LVL) {
    this.enemyGroup = this.physics.add.group();
    for (const en of LVL.enemies) {
      const key = en.fast ? 'tex_enemy_fast' : 'tex_enemy_slow';
      const spr = this.enemyGroup.create(en.x, en.y, key);
      spr.body.allowGravity = false;
      spr.setData('startX', en.x);
      spr.setData('range', en.range);
      spr.setData('fast', en.fast);
      spr.setData('dir', -1);
      spr.setData('alive', true);
      spr.body.setVelocityX(en.fast ? -110 : -70);
    }
  }

  /* ── Jogador ────────────────────────────────────────────────── */
  _buildPlayer(LVL) {
    this.player = this.physics.add.sprite(LVL.playerStart.x, LVL.playerStart.y, 'tex_player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocityY(900);
    this.player.body.setSize(28, 58);
    this.player.body.setOffset(6, 3);
  }

  /* ── Meta: PC Central ───────────────────────────────────────── */
  _buildGoal(LVL) {
    this.goalGfx = this.add.graphics().setDepth(4);
    this._drawGoalGfx(0);
    this.goalZone = new Phaser.Geom.Rectangle(LVL.goalX, LVL.goalY, 60, 130);
  }

  _drawGoalGfx(t) {
    const g  = this.goalGfx;
    const gx = this.LVL.goalX, gy = this.LVL.goalY;
    const gl = 0.55 + Math.sin(t * 0.003) * 0.35;
    g.clear();
    // Aura pulsante
    g.fillStyle(C.neon, gl * 0.08); g.fillRect(gx-14, gy-10, 88, 148);
    g.fillStyle(C.neon, gl * 0.06); g.fillRect(gx-8, gy-5, 76, 138);
    // Borda
    g.lineStyle(2, C.neon, gl * 0.7); g.strokeRect(gx-4, gy, 68, 128);
    g.lineStyle(1, C.cyan, gl * 0.3); g.strokeRect(gx-2, gy+2, 64, 124);
    // Corpo do servidor
    g.fillStyle(0x080E18, 1); g.fillRect(gx, gy+8, 60, 118);
    g.fillStyle(0x0D1828, 1); g.fillRect(gx+1, gy+9, 58, 116);
    // Tela principal
    g.fillStyle(0x007755, gl * 0.9); g.fillRect(gx+5, gy+16, 50, 80);
    g.fillStyle(0x000000, 0.15);
    for (let sy = gy+16; sy < gy+96; sy += 4) g.fillRect(gx+5, sy, 50, 2);
    // Texto na tela
    g.fillStyle(0xDDFFEE, gl * 0.9); g.fillRect(gx+9, gy+22, 8, 6);
    g.fillStyle(0xFFFFFF, gl * 0.8); g.fillRect(gx+9, gy+32, 28, 3); g.fillRect(gx+9, gy+38, 18, 3);
    g.fillStyle(0x00FF88, gl); g.fillRect(gx+9, gy+46, 12, 3); g.fillRect(gx+9, gy+52, 20, 3);
    // Cursor piscando
    if (gl > 0.7) { g.fillStyle(0x00FF88, 1); g.fillRect(gx+9, gy+60, 8, 5); }
    // Painel inferior
    g.fillStyle(0x050B14, 1); g.fillRect(gx+2, gy+100, 56, 22);
    g.fillStyle(C.neon, gl); g.fillRect(gx+52, gy+16, 5, 5);
    g.fillStyle(gl > 0.65 ? C.neon : C.green, 1); g.fillRect(gx+52, gy+24, 5, 5);
    // Cabos
    g.lineStyle(2, C.neon, gl * 0.5);
    g.lineBetween(gx+16, gy+122, gx+16, gy+134); g.lineBetween(gx+44, gy+122, gx+44, gy+134);
    // Label PC CENTRAL acima
    g.fillStyle(C.neon, gl * 0.9);
    g.fillRect(gx+2, gy-14, 56, 11);
    g.fillStyle(0x000000, 0.8); g.fillRect(gx+3, gy-13, 54, 9);
    g.fillStyle(C.neon, gl); g.fillRect(gx+5, gy-12, 3, 7);
  }

  /* ── HUD (fixo na tela via scrollFactor=0) ──────────────────── */
  _buildHUD() {
    const d = 20;
    this.hudBg   = this.add.graphics().setScrollFactor(0).setDepth(d);

    const sts = { fontFamily:'monospace', fontSize:'10px', color:'#8B949E' };
    const stv = { fontFamily:'monospace', fontSize:'12px', fontStyle:'bold', color:'#FFFFFF' };

    this.hudDataVal = this.add.text(210, 7, '0/0', stv)
      .setScrollFactor(0).setDepth(d+1).setColor('#00FFCC');
    this.hudPtsVal = this.add.text(GW-70, 7, '00000', stv)
      .setScrollFactor(0).setDepth(d+1).setColor('#FFDD57');
    this.hudZoneTxt = this.add.text(GW/2, 7, 'ZONA 0/4', sts)
      .setScrollFactor(0).setDepth(d+1).setOrigin(0.5, 0).setColor('#3B8EFF');

    this.hudFlash = this.add.text(GW/2, 36, '', {
      fontFamily:'monospace', fontSize:'13px', color:'#00FFCC',
      stroke:'#000', strokeThickness:3,
    }).setScrollFactor(0).setDepth(d+1).setOrigin(0.5, 0).setAlpha(0);

    this.termHint = this.add.text(GW/2, GH * 0.72, '[ ↑ ]  ACESSAR TERMINAL', {
      fontFamily:'monospace', fontSize:'14px', color:'#FFDD57',
      stroke:'#000', strokeThickness:3,
    }).setScrollFactor(0).setDepth(d+1).setOrigin(0.5).setAlpha(0);
  }

  _redrawHUD() {
    const g = this.hudBg;
    g.clear();
    // Painel HUD
    g.fillStyle(0x010509, 0.92); g.fillRect(0, 0, GW, 30);
    g.lineStyle(1, C.neon, 0.18); g.lineBetween(0, 30, GW, 30);

    // Blocos HP
    g.lineStyle(1, C.neon, 0.3); g.strokeRect(38, 4, 5*20+2, 22);
    for (let i = 0; i < 5; i++) {
      const on = i < this.energy;
      const col = on ? (this.energy > 3 ? C.green : this.energy > 1 ? C.yellow : C.red) : 0x141F33;
      g.fillStyle(col, on ? 0.9 : 0.4);
      g.fillRect(39 + i*20, 5, 18, 20);
    }

    // Labels HP
    g.fillStyle(C.neon, 0.5); g.fillRect(6, 10, 29, 11);
    g.fillStyle(0x000000, 0.6); g.fillRect(7, 11, 27, 9);
    // Texto "HP" com pixels
    g.fillStyle(C.neon, 0.9);
    // H
    g.fillRect(9,12,2,7); g.fillRect(12,12,2,7); g.fillRect(9,15,5,2);
    // P
    g.fillRect(15,12,2,7); g.fillRect(15,12,4,2); g.fillRect(15,15,4,2); g.fillRect(19,12,2,4);

    // Items ativos
    const items = [
      { key:'double_jump', label:'2JMP', col:C.neon },
      { key:'speed',       label:'VEL+', col:C.yellow },
      { key:'shield',      label:'ESC',  col:0xFF9944 },
    ];
    items.forEach((it, i) => {
      const ix = 152 + i*52, iy = 4;
      const on = this.items[it.key];
      g.fillStyle(it.col, on ? 0.2 : 0.05); g.fillRect(ix, iy, 48, 22);
      g.lineStyle(1, it.col, on ? 1 : 0.25); g.strokeRect(ix, iy, 48, 22);
    });

    // Barra de progresso (zona)
    const zone = Math.min(4, Math.floor(this.player.x / (WW / 5)));
    g.fillStyle(C.blue, 0.15); g.fillRect(GW/2-80, 4, 160, 22);
    g.fillStyle(C.blue, 0.55); g.fillRect(GW/2-80, 4, zone * 40, 22);
    g.lineStyle(1, C.blue, 0.4); g.strokeRect(GW/2-80, 4, 160, 22);

    // Dados / pontos
    g.fillStyle(0xFFFFFF, 0.06); g.fillRect(GW-110, 4, 106, 22);
    g.lineStyle(1, C.yellow, 0.2); g.strokeRect(GW-110, 4, 106, 22);

    // Atualiza textos
    this.hudDataVal.setText(`${this.dataCount}/${this.LVL.totalData}`);
    this.hudPtsVal.setText(String(this.score).padStart(5, '0'));
    this.hudZoneTxt.setText(`ZONA ${zone}/4`);

    // Items labels
    ['2JMP','VEL+','ESC'].forEach((lbl, i) => {
      const ix = 152 + i*52 + 24, iy = 15;
      // (texto já desenhado via Graphics primitivos acima)
    });

    // Flash
    if (this.flashTimer > 0) {
      this.flashTimer--;
      this.hudFlash.setAlpha(Math.min(1, this.flashTimer / 20));
    } else {
      this.hudFlash.setAlpha(0);
    }
  }

  flash(txt, col) {
    this.hudFlash.setText(txt);
    this.hudFlash.setColor(col || '#00FFCC');
    this.flashTimer = 100;
  }

  /* ── Quiz UI ────────────────────────────────────────────────── */
  _buildQuizUI() {
    const d = 50;
    this.quizContainer = this.add.container(GW/2, GH/2).setScrollFactor(0).setDepth(d).setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x010810, 0.97); bg.fillRoundedRect(-320, -175, 640, 350, 12);
    bg.lineStyle(2, C.neon, 0.85); bg.strokeRoundedRect(-320, -175, 640, 350, 12);
    bg.lineStyle(1, C.neon, 0.2); bg.strokeRoundedRect(-316, -171, 632, 342, 10);

    this.quizLabel = this.add.text(0, -152, 'TERMINAL — QUESTÃO DE HARDWARE', {
      fontFamily:'monospace', fontSize:'11px', color:'#00FFCC', letterSpacing:3,
    }).setOrigin(0.5);

    this.quizQ = this.add.text(0, -102, '', {
      fontFamily:'monospace', fontSize:'16px', fontStyle:'bold',
      color:'#E6EDF3', wordWrap:{width:580}, align:'center',
    }).setOrigin(0.5);

    this.quizBtns = [];
    const ys = [18, 72, 126];
    ['A', 'B', 'C'].forEach((ltr, i) => {
      const bg2 = this.add.graphics();
      bg2.fillStyle(0x0C1A2E, 1); bg2.fillRoundedRect(-295, ys[i]-19, 590, 38, 6);
      bg2.lineStyle(1, 0x21262D, 1); bg2.strokeRoundedRect(-295, ys[i]-19, 590, 38, 6);
      const lbl = this.add.text(-279, ys[i], ltr+')', { fontFamily:'monospace', fontSize:'13px', color:'#3B8EFF' }).setOrigin(0, 0.5);
      const opt = this.add.text(-255, ys[i], '', { fontFamily:'monospace', fontSize:'13px', color:'#E6EDF3', wordWrap:{width:520} }).setOrigin(0, 0.5);
      const zone = this.add.zone(-295, ys[i]-19, 590, 38).setOrigin(0,0).setInteractive({useHandCursor:true});
      zone.on('pointerover', () => { bg2.clear(); bg2.fillStyle(0x003B22,1); bg2.fillRoundedRect(-295,ys[i]-19,590,38,6); bg2.lineStyle(1,C.neon,0.8); bg2.strokeRoundedRect(-295,ys[i]-19,590,38,6); });
      zone.on('pointerout',  () => { bg2.clear(); bg2.fillStyle(0x0C1A2E,1); bg2.fillRoundedRect(-295,ys[i]-19,590,38,6); bg2.lineStyle(1,0x21262D,1); bg2.strokeRoundedRect(-295,ys[i]-19,590,38,6); });
      zone.on('pointerdown', () => this._answerQuiz(i));
      this.quizBtns.push({ bg:bg2, lbl, opt, zone });
    });

    this.quizReward = this.add.text(0, 158, '', {
      fontFamily:'monospace', fontSize:'11px', color:'#8B949E',
    }).setOrigin(0.5);

    this.quizContainer.add([bg, this.quizLabel, this.quizQ, this.quizReward,
      ...this.quizBtns.flatMap(b => [b.bg, b.lbl, b.opt, b.zone])]);
    this._activeQuiz = null;
  }

  _openQuiz(quizIdx) {
    if (this.quizOpen) return;
    const q = QUIZ[quizIdx % QUIZ.length];
    this._activeQuiz = q;
    this.quizOpen = true;
    this.physics.pause();
    this.quizQ.setText(q.q);
    q.opts.forEach((o, i) => this.quizBtns[i].opt.setText(o));
    this.quizReward.setText('Acerte para ganhar: ' + q.itemName);
    this.quizContainer.setVisible(true).setAlpha(0);
    this.tweens.add({ targets:this.quizContainer, alpha:1, duration:220 });
  }

  _answerQuiz(idx) {
    if (!this._activeQuiz) return;
    const q = this._activeQuiz;
    this.tweens.add({
      targets: this.quizContainer, alpha:0, duration:200,
      onComplete: () => {
        this.quizContainer.setVisible(false);
        this.quizOpen = false;
        this.physics.resume();
        this._activeQuiz = null;
        if (idx === q.c) {
          this.items[q.item] = true;
          this.score += 50;
          this.flash('CORRETO! +50  ' + q.itemName, '#00FFCC');
          this.cameras.main.flash(300, 0, 255, 180);
        } else {
          this.flash('INCORRETO — ' + q.opts[q.c], '#FF4444');
        }
      },
    });
  }

  /* ── Toast de zona ──────────────────────────────────────────── */
  _showZoneToast(zone) {
    if (zone === this.zoneShown) return;
    this.zoneShown = zone;
    const names = ['ZONA 0 — TUTORIAL','ZONA 1 — SERVIDORES','ZONA 2 — MATRIZ','ZONA 3 — FIREWALL','ZONA 4 — PC CENTRAL'];
    this.zoneToast.setText(names[zone] || '');
    this.tweens.killTweensOf(this.zoneToast);
    this.tweens.add({ targets:this.zoneToast, alpha:{from:0,to:1}, duration:350, yoyo:true, hold:1500, ease:'Sine.easeInOut' });
  }

  /* ── Controles mobile ───────────────────────────────────────── */
  _setupMobile() {
    const wire = (id, prop, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart',  e => { e.preventDefault(); this[prop] = val; }, {passive:false});
      el.addEventListener('touchend',    e => { e.preventDefault(); this[prop] = !val; }, {passive:false});
      el.addEventListener('touchcancel', e => { e.preventDefault(); this[prop] = !val; }, {passive:false});
    };
    wire('btnLeft', 'mobileL', true);
    wire('btnRight', 'mobileR', true);
    const bj = document.getElementById('btnJump');
    if (bj) {
      bj.addEventListener('touchstart',  e => { e.preventDefault(); this.mobileJ = true;  }, {passive:false});
      bj.addEventListener('touchend',    e => { e.preventDefault(); this.mobileJ = false; }, {passive:false});
      bj.addEventListener('touchcancel', e => { e.preventDefault(); this.mobileJ = false; }, {passive:false});
    }
  }

  /* ── Loop principal ─────────────────────────────────────────── */
  update(time, delta) {
    if (this.gameOver || this.won || this.quizOpen) return;

    const p   = this.player;
    const b   = p.body;
    const gnd = b.blocked.down;

    // ── Câmera: X suave (40% à frente), Y travado em 0 ──
    const targetX = Math.max(0, Math.min(WW - GW, p.x - GW * 0.38));
    this._camTargetX += (targetX - this._camTargetX) * 0.1;
    this.cameras.main.scrollX = this._camTargetX;
    this.cameras.main.scrollY = 0;

    // ── Zona ──
    this._showZoneToast(Math.min(4, Math.floor(p.x / (WW / 5))));

    // ── Movimento horizontal ──
    const spd = this.items.speed ? SPD_B : SPD_N;
    const goL = this.cursors.left.isDown  || this.wasd.A.isDown || this.mobileL;
    const goR = this.cursors.right.isDown || this.wasd.D.isDown || this.mobileR;

    if (goL)      { b.setVelocityX(-spd); p.setFlipX(true);  }
    else if (goR) { b.setVelocityX( spd); p.setFlipX(false); }
    else          { b.setVelocityX(b.velocity.x * 0.6); }

    // ── Salto ──
    const jumpNow =
      Phaser.Input.Keyboard.JustDown(this.cursors.up)   ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W)       ||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)   ||
      (!this._prevMobJump && this.mobileJ);

    if (jumpNow) {
      if (gnd || this.coyoteTime > 0) {
        b.setVelocityY(JUMP_VY);
        this.extraJumps = this.items.double_jump ? 1 : 0;
        this.coyoteTime = 0;
      } else if (this.extraJumps > 0) {
        b.setVelocityY(JUMP2_VY);
        this.extraJumps--;
      }
    }
    this._prevMobJump = this.mobileJ;

    // Coyote time
    if (!gnd && this.wasGround) this.coyoteTime = 8;
    if (this.coyoteTime > 0) this.coyoteTime--;
    if (gnd) this.extraJumps = this.items.double_jump ? 1 : 0;
    this.wasGround = gnd;

    // Pisca quando invencível
    if (this.invincible > 0) {
      this.invincible--;
      p.setAlpha(Math.floor(this.invincible / 6) % 2 === 0 ? 1 : 0.3);
    } else { p.setAlpha(1); }

    // ── Sub-sistemas ──
    this._tickEnemies();
    this._tickData();
    this._tickFirewalls();
    this._tickCheckpoints();
    this._tickTerminals();

    // ── Meta ──
    this._drawGoalGfx(time);
    if (Phaser.Geom.Rectangle.Contains(this.goalZone, p.x, p.y)) this._onVictory();

    // Morte por queda
    if (p.y > GH + 80) this._respawn();

    this._redrawHUD();
  }

  _tickEnemies() {
    const p = this.player;
    this.enemyGroup.getChildren().forEach(en => {
      if (!en.getData('alive')) return;
      const sx = en.getData('startX'), range = en.getData('range'), fast = en.getData('fast');
      let dir = en.getData('dir');
      const spd = fast ? 110 : 70;
      if (en.x < sx - range || en.x > sx + range) { dir *= -1; en.setData('dir', dir); }
      en.body.setVelocityX(dir * spd); en.setFlipX(dir > 0);

      if (this.invincible > 0) return;
      if (!Phaser.Geom.Rectangle.Overlaps(p.getBounds(), en.getBounds())) return;

      const stomping = p.body.velocity.y > 60 && p.body.bottom < en.body.top + 16;
      if (stomping) {
        en.setData('alive', false); en.setVisible(false); en.body.enable = false;
        p.body.setVelocityY(JUMP_VY * 0.6);
        this.score += 25;
        this.flash('VÍRUS DESTRUÍDO  +25', '#CC88FF');
        this.cameras.main.shake(140, 0.006);
      } else {
        this._damage(false);
      }
    });
  }

  _tickData() {
    this.physics.overlap(this.player, this.dataGroup, (pl, d) => {
      d.destroy();
      this.dataCount++;
      this.score += 10;
      this.flash('DADO COLETADO  +10', '#00FFCC');
      this.cameras.main.flash(100, 0, 180, 140, true);
    });
  }

  _tickFirewalls() {
    if (this.invincible > 0) return;
    this.physics.overlap(this.player, this.fwGroup, () => {
      if (this.items.shield) {
        this.items.shield = false;
        this.flash('ESCUDO ATIVADO!', '#FFDD57');
        this.cameras.main.shake(200, 0.009);
        this.invincible = 40;
      } else {
        this._damage(true);
        this.flash('FIREWALL!', '#FF5500');
      }
    });
  }

  _tickCheckpoints() {
    this.physics.overlap(this.player, this.cpGroup, (pl, cp) => {
      if (cp.getData('activated')) return;
      cp.setData('activated', true); cp.setTexture('tex_cp_on');
      this.lastCpX = cp.getData('ox');
      this.lastCpY = GY - 80;
      this.flash('CHECKPOINT!', '#FFDD57');
      this.cameras.main.flash(220, 255, 200, 0, false);
    });
  }

  _tickTerminals() {
    let near = false, nearIdx = -1;
    this.termGroup.getChildren().forEach(t => {
      const ti = t.getData('idx');
      if (this.usedTerminals.has(ti)) return;
      if (!Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), t.getBounds())) return;
      near = true; nearIdx = t.getData('quizIdx');
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
        this.usedTerminals.add(ti);
        this._openQuiz(nearIdx);
      }
    });
    this.termHint.setAlpha(near ? Math.min(1, this.termHint.alpha + 0.09) : Math.max(0, this.termHint.alpha - 0.09));
  }

  _damage(isFirewall) {
    if (this.invincible > 0) return;
    this.energy--; this.invincible = 110;
    if (isFirewall) {
      this.player.body.setVelocityX(this.player.body.velocity.x > 0 ? -200 : 200);
      this.player.body.setVelocityY(-220);
    }
    this.cameras.main.shake(220, 0.012);
    this.cameras.main.flash(180, 220, 0, 0, true);
    if (this.energy <= 0) {
      this.gameOver = true;
      this.time.delayedCall(500, () => this.scene.start('EndScene', {
        win:false, score:this.score, data:this.dataCount, total:this.LVL.totalData,
        time: Math.floor((Date.now()-this.startTime)/1000), deaths:this.deaths,
      }));
    } else {
      this.flash('DANO! (' + this.energy + ' HP)', '#FF4444');
    }
  }

  _respawn() {
    this.deaths++;
    this.energy = Math.max(1, this.energy - 1);
    this.player.setPosition(this.lastCpX, this.lastCpY);
    this.player.body.setVelocity(0, 0);
    this.cameras.main.shake(280, 0.014);
    this.invincible = 100;
    this.flash('QUEDA!', '#FF4444');
    if (this.energy <= 0) {
      this.gameOver = true;
      this.time.delayedCall(400, () => this.scene.start('EndScene', {
        win:false, score:this.score, data:this.dataCount, total:this.LVL.totalData,
        time: Math.floor((Date.now()-this.startTime)/1000), deaths:this.deaths,
      }));
    }
  }

  _onVictory() {
    if (this.won) return;
    this.won = true;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    salvarResultadoJogo(this.score, {
      dadosColetados: this.dataCount,
      tempo: elapsed,
      mortes: this.deaths,
    });
    this.cameras.main.flash(700, 0, 255, 180);
    this.cameras.main.shake(300, 0.012);
    this.time.delayedCall(1000, () => this.scene.start('EndScene', {
      win:true, score:this.score, data:this.dataCount, total:this.LVL.totalData,
      time: elapsed, deaths: this.deaths,
    }));
  }
}

/* ═══════════════════════════════════════════════════════════════
   EndScene — vitória / game over
═══════════════════════════════════════════════════════════════ */
class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }
  init(d) { this.result = d; }

  create() {
    const { win, score, data, total, time, deaths } = this.result;
    const cx = GW/2, cy = GH/2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(C.sky0, C.sky0, C.sky1, C.sky1, 1);
    bg.fillRect(0, 0, GW, GH);

    // Estrelas no fundo
    const rng = new Phaser.Math.RandomDataGenerator(['end_stars']);
    for (let i = 0; i < 120; i++) {
      bg.fillStyle(rng.pick([0xFFFFFF,0xAADDFF,0x88CCFF]), rng.realInRange(0.2, 0.7));
      bg.fillRect(rng.integerInRange(0,GW), rng.integerInRange(0,GH), 1, 1);
    }

    // Overlay temático
    const ov = this.add.graphics();
    ov.fillStyle(win ? C.neon : C.red, 0.04); ov.fillRect(0, 0, GW, GH);

    // Painel central
    const p = this.add.graphics();
    p.fillStyle(0x040C18, 0.96); p.fillRoundedRect(cx-340, cy-240, 680, 480, 16);
    p.lineStyle(2, win ? C.neon : C.red, 0.75); p.strokeRoundedRect(cx-340, cy-240, 680, 480, 16);
    p.lineStyle(1, win ? C.neon : C.red, 0.18); p.strokeRoundedRect(cx-336, cy-236, 672, 472, 14);

    // Status
    this.add.text(cx, cy-208, win ? 'MISSÃO CONCLUÍDA' : 'SISTEMA COMPROMETIDO', {
      fontFamily:'monospace', fontSize:'13px', color: win ? '#3EBB5A' : '#E33B3B', letterSpacing:5,
    }).setOrigin(0.5);

    // Título
    const title = this.add.text(cx, cy-155, win ? 'PC CENTRAL' : 'GAME OVER', {
      fontFamily:'monospace', fontSize:'58px', fontStyle:'bold',
      color: win ? '#00FFCC' : '#FF4444',
      stroke: win ? '#002211' : '#330000', strokeThickness:5,
    }).setOrigin(0.5);
    this.tweens.add({ targets:title, alpha:{from:0.75,to:1}, duration:1000, yoyo:true, repeat:-1 });

    // Estatísticas
    const stats = [
      [`DADOS COLETADOS`, `${data} / ${total}`],
      [`TEMPO`, `${Math.floor(time/60)}m ${time%60}s`],
      [`MORTES`, `${deaths}`],
    ];
    stats.forEach(([lbl, val], i) => {
      const row = cy - 65 + i * 34;
      this.add.text(cx - 160, row, lbl + ':', { fontFamily:'monospace', fontSize:'13px', color:'#8B949E' }).setOrigin(0, 0.5);
      this.add.text(cx + 120, row, val, { fontFamily:'monospace', fontSize:'13px', fontStyle:'bold', color:'#C9D1D9' }).setOrigin(1, 0.5);
    });

    // Score
    this.add.text(cx, cy+28, String(score), {
      fontFamily:'monospace', fontSize:'70px', fontStyle:'bold', color:'#FFFFFF',
    }).setOrigin(0.5);
    this.add.text(cx, cy+88, 'PONTOS', { fontFamily:'monospace', fontSize:'14px', color:'#8B949E', letterSpacing:4 }).setOrigin(0.5);

    // Rating
    const r = score >= 1200 ? 'S' : score >= 800 ? 'A' : score >= 500 ? 'B' : score >= 250 ? 'C' : 'D';
    const rc = r === 'S' ? '#FFD700' : r === 'A' ? '#00FFCC' : r === 'B' ? '#3EBB5A' : '#8B949E';
    this.add.text(cx+210, cy+28, r, {
      fontFamily:'monospace', fontSize:'80px', fontStyle:'bold', color:rc, stroke:'#000', strokeThickness:4,
    }).setOrigin(0.5);

    // Divisória
    const ln = this.add.graphics();
    ln.lineStyle(1, win ? C.neon : C.red, 0.22); ln.lineBetween(cx-300, cy+110, cx+300, cy+110);

    // Botões
    this._btn(cx - 100, cy+160, win ? 'JOGAR NOVAMENTE' : 'TENTAR NOVAMENTE',
      win ? C.neon : C.red, win ? 0x003B22 : 0x330000, () => this.scene.start('GameScene'));
    this._btn(cx + 170, cy+160, 'MENU', 0x8B949E, 0x0D1520, () => this.scene.start('StartScene'));

    // Botão voltar à plataforma
    const vol = this.add.text(cx, cy + 210, '← VOLTAR À PLATAFORMA', {
      fontFamily:'monospace', fontSize:'12px', color:'#555D68',
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    vol.on('pointerover', () => vol.setColor('#C9D1D9'));
    vol.on('pointerout',  () => vol.setColor('#555D68'));
    vol.on('pointerdown', () => voltarPlataforma());
  }

  _btn(x, y, label, col, bg, cb) {
    const w = label.length * 9 + 36, h = 44;
    const r = this.add.rectangle(x, y, w, h, bg, 1).setStrokeStyle(2, col).setInteractive({useHandCursor:true});
    const t = this.add.text(x, y, label, {
      fontFamily:'monospace', fontSize:'14px', fontStyle:'bold',
      color:'#' + col.toString(16).padStart(6,'0'),
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    r.on('pointerover', () => r.setFillStyle(col, 0.2)); r.on('pointerout', () => r.setFillStyle(bg, 1));
    r.on('pointerdown', cb); t.on('pointerdown', cb);
    t.on('pointerover', () => r.setFillStyle(col, 0.2)); t.on('pointerout', () => r.setFillStyle(bg, 1));
  }
}

/* ═══════════════════════════════════════════════════════════════
   Configuração do Phaser
   Referência: padrão dos exemplos yandeu, thedevdojo, phaserjs
   — zoom=1, FIT mode, câmera acompanha X manualmente
═══════════════════════════════════════════════════════════════ */
const game = new Phaser.Game({
  type:            Phaser.AUTO,
  backgroundColor: '#020810',
  physics: {
    default: 'arcade',
    arcade:  { gravity:{ y:0 }, debug:false },
  },
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent:     'gameContainer',
    width:      GW,
    height:     GH,
  },
  scene: [BootScene, StartScene, GameScene, EndScene],
});
