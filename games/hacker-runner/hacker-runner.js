'use strict';
// ── Hacker Runner — Phaser 3 ─────────────────────────────────

/* ── Integração com a plataforma ─────────────────────────────── */
function voltarPlataforma() { window.location.href = '../../index.html'; }
function lerAlunoId() { return new URLSearchParams(window.location.search).get('alunoId') || ''; }
function salvarResultadoJogo(pts) {
  localStorage.setItem('lusca_pending_game_result', JSON.stringify({
    alunoId:   lerAlunoId(),
    gameId:    'hacker-runner',
    moduloId:  new URLSearchParams(window.location.search).get('moduloId') || 'hardware',
    status:    'completed',
    score:     pts,
    timestamp: new Date().toISOString(),
  }));
}

/* ── Constantes ──────────────────────────────────────────────── */
const GW     = 1280;   // largura do canvas (game units)
const GH     = 720;    // altura do canvas
const GY     = 648;    // topo do chão
const PH     = 24;     // altura das plataformas
const JUMP1  = -640;   // impulso do salto simples
const JUMP2  = -540;   // impulso do salto duplo
const SPD_N  = 220;    // velocidade normal (px/s)
const SPD_B  = 330;    // velocidade com boost
const WW     = 10880;  // largura total do mundo

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
// Retorna arrays com tudo que existe no mundo.
// Plataformas: { x, y, w, h, type:'g'|'p' }
// Inimigos:    { x, range, fast }
// Dados:       { x, y }
// Firewalls:   { x }
// Terminais:   { x, quizIdx }   — quiz OPCIONAL ao pressionar ↑
// Checkpoints: { x }
function buildLevel() {
  const platforms  = [];
  const enemies    = [];
  const dataItems  = [];
  const firewalls  = [];
  const terminals  = [];
  const checkpts   = [];

  function ground(x, w)           { platforms.push({x, y:GY, w, h:PH, type:'g'}); }
  function plat(x, y, w)          { platforms.push({x, y, w, h:PH, type:'p'}); }
  function enemy(x, range, fast)  { enemies.push({x, y:GY-30, range, fast:!!fast}); }
  function data(x, y)             { dataItems.push({x, y: y || GY-40}); }
  function fw(x)                  { firewalls.push({x}); }
  function terminal(x, qi)        { terminals.push({x, y:GY-62, quizIdx:qi}); }

  // ── ZONA 0 — Tutorial (0–2200) ────────────────────────────────
  // Chão contínuo — sem buracos, ensina movimento e salto.
  ground(0, 2200);

  plat(380, GY-120, 160);
  plat(620, GY-160, 180);
  plat(880, GY-120, 160);
  plat(1140, GY-170, 200);
  plat(1440, GY-130, 160);
  plat(1720, GY-110, 180);

  // Dados guiam o caminho do jogador
  [160,300].forEach(x => data(x));
  data(400, GY-120); data(460, GY-160); data(640, GY-160);
  data(700, GY-120); data(900, GY-120); data(960);
  data(1140, GY-170); data(1200, GY-130); data(1460, GY-130);
  data(1520); data(1740, GY-110); data(1840); data(2000);

  enemy(520, 140, false);
  enemy(1080, 120, false);
  enemy(1660, 100, false);

  terminal(900, 0);
  checkpts.push({x:2100});

  // ── ZONA 1 — Servidores (2200–4620) ───────────────────────────
  // Buracos simples com plataformas de apoio, introdução de firewalls.
  ground(2200, 500);  // ── gap 200px (x=2700–2900)
  ground(2900, 480);  // ── gap 200px (x=3380–3580)
  ground(3580, 440);  // ── gap 200px (x=4020–4220)
  ground(4220, 400);

  // Plataformas de apoio sobre cada buraco (1 salto confortável)
  plat(2730, GY-140, 200);
  plat(3410, GY-150, 180);
  plat(4050, GY-140, 180);

  // Plataformas de altura para variedade
  plat(2310, GY-170, 140);
  plat(2490, GY-130, 140);
  plat(3000, GY-160, 150);
  plat(3170, GY-210, 130);
  plat(3670, GY-150, 150);
  plat(3840, GY-200, 130);
  plat(4310, GY-170, 150);
  plat(4480, GY-210, 120);

  fw(2400); fw(2520);
  fw(3090); fw(3200);
  fw(3750); fw(3900);

  [2260,2340,2760,2860,3020,3100,3200,3700,3780,4080,4180,4360,4440].forEach(x => data(x));
  data(2310, GY-170); data(3170, GY-210); data(3840, GY-200); data(4480, GY-210);

  enemy(2380, 150, false);
  enemy(3050, 130, false);
  enemy(3700, 110, true);
  enemy(4340, 120, false);

  terminal(2900, 1);
  terminal(3780, 2);
  checkpts.push({x:4550});

  // ── ZONA 2 — Matriz (4620–6760) ───────────────────────────────
  // Buracos maiores, plataformas em níveis, mais firewalls.
  ground(4620, 420);  // gap 220px
  ground(5260, 380);  // gap 220px
  ground(5860, 360);  // gap 240px
  ground(6460, 400);

  plat(5060, GY-160, 220);
  plat(5660, GY-170, 220);
  plat(6260, GY-160, 220);

  // Nível extra nas plataformas (salto progressivo)
  plat(4720, GY-190, 140);
  plat(4880, GY-150, 130);
  plat(5360, GY-210, 120);
  plat(5500, GY-170, 130);
  plat(5960, GY-200, 140);
  plat(6110, GY-240, 120);
  plat(6560, GY-180, 140);
  plat(6690, GY-220, 120);

  fw(4700); fw(4820); fw(4960);
  fw(5180); fw(5310); fw(5460);
  fw(5880); fw(6020); fw(6160);
  fw(6480); fw(6580); fw(6700);

  [4680,4780,4900,5000,5100,5200,5300,5400,5700,5820,5920,6060,6160,6280,6480,6560].forEach(x => data(x));
  data(4720, GY-190); data(5360, GY-210); data(5960, GY-200); data(6110, GY-240); data(6690, GY-220);

  enemy(4720, 140, false);
  enemy(5120, 110, true);
  enemy(5310, 100, true);
  enemy(5800, 130, false);
  enemy(6490, 120, true);

  terminal(5260, 3);
  terminal(6220, 4);
  checkpts.push({x:6740});

  // ── ZONA 3 — Firewall Central (6760–8960) ─────────────────────
  // Firewalls em grupos de 3, inimigos rápidos.
  ground(6760, 380);  // gap 220px
  ground(7380, 360);  // gap 240px
  ground(8020, 340);  // gap 220px
  ground(8600, 500);

  plat(7200, GY-180, 220);
  plat(7820, GY-190, 220);
  plat(8400, GY-170, 200);

  plat(6860, GY-210, 130);
  plat(7000, GY-250, 120);
  plat(7500, GY-220, 130);
  plat(7640, GY-260, 120);
  plat(8120, GY-210, 130);
  plat(8270, GY-250, 120);
  plat(8700, GY-190, 140);
  plat(8850, GY-230, 120);

  // Grupos de 3 firewalls (1 salto cobre o grupo inteiro)
  [6800,6870,6940].forEach(x => fw(x));
  [7100,7170,7240].forEach(x => fw(x));
  [7440,7510,7580].forEach(x => fw(x));
  [8060,8130,8200].forEach(x => fw(x));
  [8440,8510,8580].forEach(x => fw(x));
  [8660,8730,8800,8870].forEach(x => fw(x));

  [6780,6860,6940,7220,7320,7440,7560,7840,7940,8060,8300,8440,8540,8640,8760,8860].forEach(x => data(x));
  data(7000, GY-250); data(7640, GY-260); data(8270, GY-250); data(8850, GY-230);

  enemy(6820, 120, true);
  enemy(7100, 110, false);
  enemy(7440, 100, true);
  enemy(7950, 90,  true);
  enemy(8640, 110, true);
  enemy(8800, 90,  true);

  terminal(7380, 5);
  terminal(8600, 6);
  checkpts.push({x:8920});

  // ── ZONA 4 — PC Central (8960–10880) ──────────────────────────
  // Gauntlet final — todos os inimigos são rápidos.
  // Buracos mais longos, firewalls em grupos maiores.
  ground(8960, 360);  // gap 240px
  ground(9600, 340);  // gap 240px
  ground(10200, 340); // gap 220px
  ground(10700, 280); // chegada ao PC Central

  plat(9330, GY-190, 240);
  plat(9940, GY-200, 240);
  plat(10550, GY-180, 160);

  plat(9060, GY-220, 130);
  plat(9200, GY-260, 120);
  plat(9660, GY-230, 130);
  plat(9800, GY-270, 120);
  plat(10260, GY-220, 130);
  plat(10400, GY-260, 120);
  plat(10760, GY-200, 140);

  [9000,9080,9160,9240].forEach(x => fw(x));
  [9380,9460,9540,9620].forEach(x => fw(x));
  [9980,10060,10140,10220].forEach(x => fw(x));
  [10440,10520,10600,10680].forEach(x => fw(x));

  [9000,9080,9180,9360,9460,9560,9660,9760,9980,10060,10160,10260,10480,10580,10680,10760].forEach(x => data(x));
  data(9200, GY-260); data(9800, GY-270); data(10400, GY-260);

  enemy(9060,  90, true);
  enemy(9260,  80, true);
  enemy(9660, 100, true);
  enemy(9860,  90, true);
  enemy(10260, 80, true);
  enemy(10480, 100, true);

  terminal(9600, 7);
  terminal(10200, 8);
  checkpts.push({x:10640});

  return {
    platforms, enemies, dataItems, firewalls, terminals, checkpts,
    playerStart: { x:80, y:GY-60 },
    goalX: 10760, goalY: GY-130,
  };
}

/* ── Paleta ──────────────────────────────────────────────────── */
const C = {
  bg0:    0x020810,
  bg1:    0x060F20,
  bg2:    0x0A1530,
  ground: 0x0C2240,
  ground2:0x081520,
  plat:   0x111E30,
  plat2:  0x1A2D46,
  edge:   0x388BFD,
  neon:   0x00FFCC,
  cyan:   0x00D4AA,
  blue:   0x388BFD,
  yellow: 0xFFDD57,
  red:    0xDA3633,
  orange: 0xFF4500,
  purple: 0x7B2FBE,
  pink:   0x8B1A4A,
  green:  0x3FB950,
  white:  0xFFFFFF,
};

/* ═══════════════════════════════════════════════════════════════
   CENA: StartScene — tela de título
═══════════════════════════════════════════════════════════════ */
class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  create() {
    const cx = GW / 2, cy = GH / 2;

    // Fundo gradiente
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bg0, C.bg0, C.bg2, C.bg2, 1);
    bg.fillRect(0, 0, GW, GH);

    // Grid
    const grid = this.add.graphics();
    grid.lineStyle(0.5, C.neon, 0.04);
    for (let x = 0; x < GW; x += 40) grid.lineBetween(x, 0, x, GH);
    for (let y = 0; y < GH; y += 40) grid.lineBetween(0, y, GW, y);

    // Prédios decorativos
    this._drawBuildings(bg);

    // Linha divisória
    this.add.rectangle(cx, cy - 20, 500, 1, C.neon, 0.15);

    // Título
    this.add.text(cx, cy - 120, 'MÓDULO HARDWARE', {
      fontFamily:'monospace', fontSize:'14px', color:'#3FB950', letterSpacing:4
    }).setOrigin(0.5);

    const title = this.add.text(cx, cy - 70, 'HACKER RUNNER', {
      fontFamily:'monospace', fontSize:'56px', fontStyle:'bold',
      color:'#00FFCC', stroke:'#003322', strokeThickness:4,
    }).setOrigin(0.5);

    // Brilho animado no título
    this.tweens.add({
      targets: title,
      alpha: { from:1, to:0.75 },
      duration:1400, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
    });

    this.add.text(cx, cy - 15, '5 ZONAS  ·  INFILTRE A REDE  ·  PC CENTRAL', {
      fontFamily:'monospace', fontSize:'13px', color:'#58A6FF', letterSpacing:2,
    }).setOrigin(0.5);

    // Controles
    const ctrlStyle = { fontFamily:'monospace', fontSize:'12px', color:'#8B949E' };
    const ctrls = [
      ['[← →]  MOVER',     '[ESPAÇO / ↑]  PULAR'],
      ['[WASD]  ALTERNATIVO', '[↑ EM VÍRUS]  DESTRUIR'],
    ];
    ctrls.forEach((row, ri) => {
      row.forEach((txt, ci) => {
        const bx = cx - 190 + ci * 220, by = cy + 40 + ri * 30;
        const bg2 = this.add.rectangle(bx, by, 210, 24, 0x0D1520, 1)
          .setStrokeStyle(1, 0x21262D);
        this.add.text(bx, by, txt, ctrlStyle).setOrigin(0.5);
      });
    });

    this.add.text(cx, cy + 125, 'Terminais de computador oferecem power-ups — são opcionais!', {
      fontFamily:'monospace', fontSize:'11px', color:'#FFDD57',
    }).setOrigin(0.5);

    // Botão INICIAR
    this._addButton(cx, cy + 175, 'INICIAR MISSÃO', C.neon, 0x003322, () => {
      this.scene.start('GameScene');
    });

    // Botão VOLTAR
    const voltar = this.add.text(cx, cy + 225, 'VOLTAR À PLATAFORMA', {
      fontFamily:'monospace', fontSize:'12px', color:'#8B949E',
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    voltar.on('pointerover', () => voltar.setColor('#E6EDF3'));
    voltar.on('pointerout',  () => voltar.setColor('#8B949E'));
    voltar.on('pointerdown', () => voltarPlataforma());
  }

  _drawBuildings(g) {
    const blds = [14,58,20,85,10,38,24,100,16,62,18,75,10,42,22,90,14,55,20,68,16,82];
    let bx = 60;
    for (let i = 0; i < blds.length; i += 2) {
      const bw = blds[i], bh = blds[i+1], by = GH - bh - 36;
      g.fillStyle(0x040F24, 0.7); g.fillRect(bx, by, bw, bh);
      g.fillStyle(0x143250, 0.35);
      for (let ry = by+3; ry < by+bh-3; ry += 8) g.fillRect(bx+1, ry, bw-2, 5);
      bx += bw + 12;
    }
  }

  _addButton(x, y, label, textCol, bgCol, cb) {
    const w = 240, h = 44;
    const bg = this.add.rectangle(x, y, w, h, bgCol, 1)
      .setStrokeStyle(2, textCol)
      .setInteractive({useHandCursor:true});
    const txt = this.add.text(x, y, label, {
      fontFamily:'monospace', fontSize:'16px', fontStyle:'bold',
      color: Phaser.Display.Color.IntegerToColor(textCol).rgba,
    }).setOrigin(0.5);
    const hover = () => { bg.setFillStyle(textCol, 0.18); };
    const leave = () => { bg.setFillStyle(bgCol, 1); };
    bg.on('pointerover', hover);
    bg.on('pointerout',  leave);
    bg.on('pointerdown', cb);
    txt.on('pointerdown', cb);
    txt.setInteractive({useHandCursor:true});
    txt.on('pointerover', hover);
    txt.on('pointerout',  leave);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CENA: GameScene — jogo principal
═══════════════════════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Estado do jogo
    this.score       = 0;
    this.energy      = 5;
    this.invincible  = 0;
    this.extraJumps  = 0;
    this.wasGround   = false;
    this.gameOver    = false;
    this.won         = false;
    this.items       = { double_jump:false, speed:false, shield:false };
    this.flashTxt    = '';
    this.flashTimer  = 0;
    this.quizOpen    = false;
    this.lastCpX     = 80;
    this.lastCpY     = GY - 60;
    this._prevJump   = false;
    this._prevMobJump= false;
    this.coyoteTime  = 0;
    this.zoneShown   = -1;
    this.dataTotal   = 0;
    this.dataCount   = 0;

    // Terminas usados (não repete quiz)
    this.usedTerminals = new Set();

    const LVL = buildLevel();
    this.LVL = LVL;
    this.dataTotal = LVL.dataItems.length;

    // Física
    this.physics.world.setBounds(0, 0, WW, GH + 300);
    this.physics.world.gravity.y = 900;

    // Câmera zoom 2x: janela de 640x360 game units, foca onde o jogo acontece
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 342, WW, 360);

    // ── Background parallax ──
    this._createBackground();

    // ── Gera texturas únicas ──
    this._createTextures();

    // ── Plataformas e chão ──
    this.platforms = this.physics.add.staticGroup();
    for (const p of LVL.platforms) {
      const key = p.type === 'g' ? 'tex_ground' : 'tex_plat';
      // Usa um único tile e escalona o tamanho do corpo físico
      const spr = this.platforms.create(p.x + p.w/2, p.y + p.h/2, key);
      spr.setDisplaySize(p.w, p.h);
      spr.body.setSize(p.w, p.h);
      spr.refreshBody();
      spr.setData('type', p.type);
    }

    // ── Firewalls ──
    this.fwGroup = this.physics.add.staticGroup();
    for (const fw of LVL.firewalls) {
      const spr = this.fwGroup.create(fw.x + 10, GY - 40 + 20, 'tex_fw');
      spr.body.setSize(20, 80);
      spr.refreshBody();
    }

    // ── Dados coletáveis ──
    this.dataGroup = this.physics.add.staticGroup();
    for (const d of LVL.dataItems) {
      const spr = this.dataGroup.create(d.x, d.y, 'tex_data');
      spr.setData('t', Math.random() * Math.PI * 2);
      spr.body.setCircle(9, 0, 0);
      spr.refreshBody();
    }

    // ── Terminais (quiz opcional) ──
    this.termGroup = this.physics.add.staticGroup();
    for (let i = 0; i < LVL.terminals.length; i++) {
      const t = LVL.terminals[i];
      const spr = this.termGroup.create(t.x + 18, t.y + 30, 'tex_terminal');
      spr.setData('quizIdx', t.quizIdx);
      spr.setData('idx', i);
      spr.body.setSize(36, 60);
      spr.refreshBody();
    }

    // ── Checkpoints ──
    this.cpGroup = this.physics.add.staticGroup();
    for (const cp of LVL.checkpts) {
      const spr = this.cpGroup.create(cp.x + 13, GY - 20, 'tex_cp_off');
      spr.setData('activated', false);
      spr.setData('ox', cp.x);
      spr.body.setSize(26, 40);
      spr.refreshBody();
    }

    // ── Inimigos ──
    this.enemyGroup = this.physics.add.group();
    for (const en of LVL.enemies) {
      const key = en.fast ? 'tex_enemy_fast' : 'tex_enemy_slow';
      const spr = this.enemyGroup.create(en.x, en.y, key);
      spr.body.setGravityY(0);
      spr.body.allowGravity = false;
      spr.setData('startX', en.x);
      spr.setData('range',  en.range);
      spr.setData('fast',   en.fast);
      spr.setData('dir',   -1);
      spr.setData('alive',  true);
      spr.body.setVelocityX(en.fast ? -100 : -65);
    }

    // ── Jogador ──
    this.player = this.physics.add.sprite(LVL.playerStart.x, LVL.playerStart.y, 'tex_player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocityY(800);

    // ── Colisores ──
    this.physics.add.collider(this.player, this.platforms, null, this._platformProcess, this);
    this.physics.add.collider(this.enemyGroup, this.platforms, null, this._platformProcess, this);

    // ── Câmera segue o jogador ──
    this.cameras.main.startFollow(this.player, true, 0.12, 0);
    this.cameras.main.setDeadzone(60, 0);

    // ── Meta (PC Central) ──
    this._drawGoal();
    this.goalZone = new Phaser.Geom.Rectangle(LVL.goalX, LVL.goalY, 56, 110);

    // ── Controles ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd    = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.mobileL = false; this.mobileR = false; this.mobileJ = false;
    this._setupMobile();

    // ── HUD fixo ──
    this._initHUD();

    // ── UI de quiz ──
    this._initQuizUI();

    // ── UI de toast de zona ──
    this.zoneToast = this.add.text(GW/2, GH/2 - 60, '', {
      fontFamily:'monospace', fontSize:'22px', fontStyle:'bold',
      color:'#00FFCC', stroke:'#003322', strokeThickness:3,
    }).setScrollFactor(0).setDepth(30).setOrigin(0.5).setAlpha(0);

    this._showZoneToast(0);
  }

  // Plataformas one-way: jogador só pousa vindo de cima
  _platformProcess(player, plat) {
    if (plat.getData('type') !== 'p') return true;
    return player.body.velocity.y >= 0 &&
           Math.round(player.body.bottom - player.body.velocity.y * (1/60)) <= plat.body.top + 12;
  }

  /* ── Texturas geradas proceduralmente ──────────────────────── */
  _createTextures() {
    const make = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const g = this.add.graphics();
      fn(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Chão (tile 1px para tileSprite / escalonamento)
    make('tex_ground', 48, PH, g => {
      g.fillStyle(C.ground2, 1); g.fillRect(0, 0, 48, PH);
      g.fillStyle(C.ground,  1); g.fillRect(1, 1, 46, PH-2);
      g.fillStyle(C.neon, 0.45); g.fillRect(0, 0, 48, 1);
      g.fillStyle(C.edge, 0.55); g.fillRect(0, 0, 48, 1);
      g.fillStyle(C.neon, 0.25); g.fillRect(2, PH-4, 42, 1);
      for (let x = 4; x < 44; x += 12) {
        g.fillStyle(C.neon, 0.20); g.fillRect(x, 4, 8, 1);
        g.fillStyle(C.edge, 0.35); g.fillRect(x+9, 2, 1, PH-4);
      }
    });

    // Plataforma flutuante
    make('tex_plat', 48, PH, g => {
      g.fillStyle(C.plat,  1); g.fillRect(0, 0, 48, PH);
      g.fillStyle(C.plat2, 1); g.fillRect(1, 1, 46, PH-2);
      g.fillStyle(C.neon, 0.30); g.fillRect(0, 0, 48, 1);
      g.fillStyle(C.edge, 0.55); g.fillRect(0, 0, 48, 2);
      g.fillStyle(0x000000, 0.35); g.fillRect(2, 4, 44, 2); g.fillRect(2, 9, 44, 2);
      g.fillStyle(C.green, 0.80); g.fillRect(42, 3, 3, 3);
      g.fillStyle(C.blue,  0.70); g.fillRect(42, 8, 3, 3);
    });

    // Firewall
    make('tex_fw', 20, 80, g => {
      g.fillStyle(0xFF3300, 0.9); g.fillRect(0, 0, 20, 80);
      g.fillStyle(0xFF6600, 1.0); g.fillRect(0, 0, 3, 80); g.fillRect(17, 0, 3, 80);
      g.fillStyle(0x000000, 0.3);
      for (let y = 0; y < 80; y += 4) g.fillRect(3, y, 14, 1);
      g.fillStyle(0xFFCC00, 0.8); g.fillRect(1, 2, 18, 1);
    });

    // Dado coletável
    make('tex_data', 18, 18, g => {
      g.fillStyle(C.neon, 0.25);  g.fillRect(0, 0, 18, 18);
      g.fillStyle(C.neon, 0.70);  g.fillRect(2, 2, 14, 14);
      g.fillStyle(C.cyan, 1.00);  g.fillRect(3, 3, 12, 12);
      g.fillStyle(0xFFFFFF, 0.70); g.fillRect(4, 4, 5, 5);
      g.fillStyle(C.ground2, 0.5);
      g.fillRect(6, 3, 5, 12); g.fillRect(3, 6, 12, 5);
    });

    // Terminal
    make('tex_terminal', 36, 60, g => {
      // Base
      g.fillStyle(0x0A1828, 1); g.fillRect(0, 10, 36, 50);
      g.fillStyle(0x142030, 1); g.fillRect(1, 11, 34, 48);
      // Tela
      g.fillStyle(0x00CC88, 0.9); g.fillRect(4, 14, 28, 22);
      g.fillStyle(0x000000, 0.2);
      for (let y = 14; y < 36; y += 3) g.fillRect(4, y, 28, 1);
      // Texto na tela
      g.fillStyle(0xFFFFFF, 0.9); g.fillRect(6, 17, 4, 3); g.fillRect(6, 22, 16, 2);
      g.fillStyle(0xFFFF00, 0.9); g.fillRect(6, 27, 8, 2);
      // Base do terminal
      g.fillStyle(0x060E1A, 1); g.fillRect(2, 50, 32, 8);
      // Luz LED verde (quiz disponível)
      g.fillStyle(C.green, 1); g.fillRect(30, 14, 3, 3);
      // Teclado decorativo
      for (let kx = 4; kx < 30; kx += 5) g.fillRect(kx, 44, 4, 4);
    });

    // Checkpoint desativado
    make('tex_cp_off', 26, 40, g => {
      g.fillStyle(0x586069, 1); g.fillRect(6, 0, 4, 40);
      g.fillStyle(0x8B949E, 1); g.fillRect(10, 0, 16, 12);
      g.fillStyle(0x444D56, 1); g.fillRect(11, 1, 14, 10);
    });

    // Checkpoint ativado
    make('tex_cp_on', 26, 40, g => {
      g.fillStyle(C.green, 1);        g.fillRect(6, 0, 4, 40);
      g.fillStyle(0x5CD672, 1);       g.fillRect(10, 0, 16, 12);
      g.fillStyle(0xC8F7C5, 0.9);     g.fillRect(11, 1, 14, 10);
      g.fillStyle(C.green, 0.25);     g.fillRect(0, 0, 26, 40);
    });

    // Jogador (hacker com hoodie)
    make('tex_player', 24, 36, g => {
      // Pernas
      g.fillStyle(0x18222F, 1);
      g.fillRect(4, 24, 6, 10); g.fillRect(14, 24, 6, 10);
      // Tênis neon
      g.fillStyle(C.neon, 1); g.fillRect(14, 33, 7, 2);
      // Corpo
      g.fillStyle(0x18222F, 1); g.fillRect(3, 13, 18, 13);
      g.fillStyle(0x1E2C40, 1); g.fillRect(4, 14, 16, 11);
      // Tiras neon no corpo
      g.fillStyle(C.neon, 1); g.fillRect(3, 14, 2, 9); g.fillRect(19, 14, 2, 9);
      // Braço
      g.fillStyle(0x18222F, 1); g.fillRect(0, 14, 3, 7);
      // Mochila
      g.fillStyle(0x0A1520, 1); g.fillRect(1, 13, 3, 9);
      g.fillStyle(C.blue, 1);   g.fillRect(1, 14, 3, 2);
      // Capuz
      g.fillStyle(0x1A2638, 1); g.fillRect(3, 3, 18, 12);
      g.fillStyle(0x222E45, 1); g.fillRect(4, 4, 16, 10);
      // Visor / olhos
      g.fillStyle(0x0099EE, 1); g.fillRect(5, 7, 14, 5);
      g.fillStyle(0x00CCFF, 0.8); g.fillRect(5, 7, 14, 2);
      g.fillStyle(0xFFFFFF, 0.6); g.fillRect(6, 8, 4, 2);
    });

    // Inimigo lento (vírus roxo)
    make('tex_enemy_slow', 24, 24, g => {
      g.fillStyle(0x4E1580, 1);
      g.fillRect(3, 6, 18, 14); g.fillRect(5, 3, 14, 18);
      g.fillStyle(0x7B2FBE, 1);
      g.fillRect(0, 8, 3, 7); g.fillRect(21, 8, 3, 7);
      g.fillRect(8, 0, 6, 3);
      g.fillStyle(0xFF3333, 1); g.fillRect(5, 7, 4, 4); g.fillRect(15, 7, 4, 4);
      g.fillStyle(0xFFAAAA, 0.8); g.fillRect(6, 8, 2, 2); g.fillRect(16, 8, 2, 2);
      // Pernas
      g.fillStyle(0x6B2FAE, 1);
      g.fillRect(5, 19, 5, 5); g.fillRect(14, 19, 5, 5);
    });

    // Inimigo rápido (vírus rosa-vermelho)
    make('tex_enemy_fast', 24, 24, g => {
      g.fillStyle(0x8B1A4A, 1);
      g.fillRect(3, 6, 18, 14); g.fillRect(5, 3, 14, 18);
      g.fillStyle(0xCC2266, 1);
      g.fillRect(0, 8, 3, 7); g.fillRect(21, 8, 3, 7);
      g.fillRect(8, 0, 6, 3);
      g.fillStyle(0xFF3333, 1); g.fillRect(5, 7, 4, 4); g.fillRect(15, 7, 4, 4);
      g.fillStyle(0xFFAAAA, 0.8); g.fillRect(6, 8, 2, 2); g.fillRect(16, 8, 2, 2);
      // Pernas (mais longas = aparência rápida)
      g.fillStyle(0xAA1155, 1);
      g.fillRect(4, 19, 5, 6); g.fillRect(15, 19, 5, 6);
      g.fillRect(9, 18, 4, 4);
    });

    // Mini sprite de vida (coração/energy)
    make('tex_hp', 12, 12, g => {
      g.fillStyle(C.green, 1);
      g.fillRect(1,3,10,7); g.fillRect(3,1,6,2); g.fillRect(0,4,12,4);
    });
  }

  /* ── Background parallax ──────────────────────────────────── */
  _createBackground() {
    const bg = this.add.graphics().setScrollFactor(0).setDepth(-10);
    bg.fillGradientStyle(C.bg0, C.bg0, C.bg2, C.bg2, 1);
    bg.fillRect(0, 0, GW, GH);

    // Grid (parallax 0.3)
    const grid = this.add.graphics().setScrollFactor(0.3).setDepth(-9);
    grid.lineStyle(0.5, C.neon, 0.04);
    for (let x = 0; x < WW + 64; x += 40) grid.lineBetween(x, 0, x, GH);
    for (let y = 0; y < GH; y += 40) grid.lineBetween(0, y, WW + 64, y);

    // Prédios (parallax 0.12)
    const bld = this.add.graphics().setScrollFactor(0.12).setDepth(-8);
    const sizes = [14,58,20,85,10,38,24,100,16,62,18,75,10,42,22,90,14,55,20,68,
                   16,82,12,44,18,62,24,110,10,50,20,78,16,65,22,95];
    let bx = 0;
    for (let i = 0; i < sizes.length; i += 2) {
      const bw = sizes[i], bh = sizes[i+1], by = GH - bh - 36;
      bld.fillStyle(0x040F24, 0.85); bld.fillRect(bx, by, bw, bh);
      bld.fillStyle(0x143250, 0.4);
      for (let ry = by+3; ry < by+bh-3; ry += 8) bld.fillRect(bx+1, ry, bw-2, 5);
      bx += bw + 12;
      if (bx > WW) break;
    }
  }

  /* ── Meta: PC Central ────────────────────────────────────────── */
  _drawGoal() {
    this.goalGfx = this.add.graphics().setDepth(3);
    this._updateGoal(0);
  }

  _updateGoal(t) {
    const g  = this.goalGfx;
    const gx = this.LVL.goalX, gy = this.LVL.goalY;
    const gl = 0.55 + Math.sin(t * 0.003) * 0.3;
    g.clear();
    // Aura
    g.fillStyle(C.neon, gl * 0.10); g.fillRect(gx-10, gy-8, 76, 128);
    g.lineStyle(2, C.neon, gl * 0.5); g.strokeRect(gx-5, gy-3, 66, 118);
    // Corpo
    g.fillStyle(0x0A1828, 1); g.fillRect(gx, gy+10, 56, 100);
    g.fillStyle(0x142030, 1); g.fillRect(gx+1, gy+11, 54, 98);
    // Tela
    const sg = g.fillGradientStyle
      ? null : null; // usa fillStyle simples
    g.fillStyle(0x00CC88, gl * 0.95); g.fillRect(gx+5, gy+18, 46, 78);
    g.fillStyle(0x000000, 0.18);
    for (let sy = gy+18; sy < gy+96; sy += 3) g.fillRect(gx+5, sy, 46, 1);
    // Texto na tela
    g.fillStyle(0xDCFFEB, gl); g.fillRect(gx+10, gy+25, 6, 5); g.fillRect(gx+10, gy+34, 6, 5);
    g.fillStyle(0xFFFFFF, gl * 0.9); g.fillRect(gx+10, gy+44, 26, 3); g.fillRect(gx+10, gy+50, 18, 3);
    // Base
    g.fillStyle(0x060E1A, 1); g.fillRect(gx+2, gy+104, 52, 6);
    // Cabos
    g.lineStyle(2, C.neon, gl * 0.5);
    g.lineBetween(gx+14, gy+110, gx+14, gy+118);
    g.lineBetween(gx+42, gy+110, gx+42, gy+118);
    // Label
    g.fillStyle(C.neon, gl * 0.85);
    // Desenhamos com retângulos (sem fontes em Graphics)
    // Indicador LED piscando
    g.fillStyle(gl > 0.7 ? C.neon : C.green, 1);
    g.fillRect(gx+50, gy+18, 4, 4);
    g.fillRect(gx+50, gy+25, 4, 4);
  }

  /* ── HUD fixo ─────────────────────────────────────────────── */
  _initHUD() {
    const depth = 20;
    const sf = 0; // scrollFactor

    this.hudBg = this.add.graphics().setScrollFactor(sf).setDepth(depth);
    const ts = { fontFamily:'monospace', fontSize:'11px', color:'#8B949E', resolution:2 };
    const tv = { fontFamily:'monospace', fontSize:'12px', fontStyle:'bold', color:'#FFFFFF', resolution:2 };

    this.hudHpLabel  = this.add.text(6,  6,  'HP',     ts).setScrollFactor(sf).setDepth(depth+1);
    this.hudDataLbl  = this.add.text(120, 6, 'DADOS',  ts).setScrollFactor(sf).setDepth(depth+1);
    this.hudDataVal  = this.add.text(165, 6, '0/0',    tv).setScrollFactor(sf).setDepth(depth+1).setColor('#00FFCC');
    this.hudPtsLbl   = this.add.text(GW-102, 6, 'PTS', ts).setScrollFactor(sf).setDepth(depth+1);
    this.hudPtsVal   = this.add.text(GW-72,  6, '00000', tv).setScrollFactor(sf).setDepth(depth+1).setColor('#FFDD57');
    this.hudZone     = this.add.text(GW/2, 6, 'ZONA 0/4', ts).setScrollFactor(sf).setDepth(depth+1).setOrigin(0.5, 0).setColor('#388BFD');
    this.hudItems    = this.add.text(220, 6, '', { fontFamily:'monospace', fontSize:'11px', color:'#444D56', resolution:2 })
      .setScrollFactor(sf).setDepth(depth+1);

    this.hudFlash = this.add.text(GW/2, 36, '', {
      fontFamily:'monospace', fontSize:'12px', color:'#00FFCC',
      stroke:'#000', strokeThickness:2, resolution:2,
    }).setScrollFactor(sf).setDepth(depth+1).setOrigin(0.5, 0).setAlpha(0);

    // Hint do terminal (aparece quando perto)
    this.termHint = this.add.text(GW/2, GH/2 - 80, '↑  ACESSAR TERMINAL', {
      fontFamily:'monospace', fontSize:'13px', color:'#FFDD57',
      stroke:'#000', strokeThickness:2, resolution:2,
    }).setScrollFactor(sf).setDepth(depth+1).setOrigin(0.5).setAlpha(0);
  }

  _updateHUD() {
    const W = GW;
    const g = this.hudBg;
    g.clear();
    // Painel superior
    g.fillStyle(0x020612, 0.88); g.fillRect(0, 0, W, 26);
    g.lineStyle(1, C.neon, 0.14); g.lineBetween(0, 26, W, 26);

    // Caixas de HP
    g.lineStyle(1, C.neon, 0.25); g.strokeRect(36, 4, 5*16+2, 18);
    for (let i = 0; i < 5; i++) {
      const filled = i < this.energy;
      const col = filled
        ? (this.energy > 3 ? C.green : this.energy > 1 ? C.yellow : C.red)
        : 0x141F33;
      g.fillStyle(col, filled ? 0.9 : 0.5);
      g.fillRect(37 + i*16, 5, 14, 16);
    }

    // Items
    const itemList = [
      { key:'double_jump', label:'2xJMP', col:C.neon },
      { key:'speed',       label:'VEL+',  col:C.yellow },
      { key:'shield',      label:'ESC',   col:0xFF9944 },
    ];
    itemList.forEach((it, i) => {
      const ix = 120 + i * 42, iy = 4;
      const on = this.items[it.key];
      g.fillStyle(it.col, on ? 0.18 : 0.06); g.fillRect(ix, iy, 38, 18);
      g.lineStyle(1, it.col, on ? 0.9 : 0.20); g.strokeRect(ix, iy, 38, 18);
    });

    // Barra de progresso da zona
    const zone = Math.min(4, Math.floor(this.player.x / (WW / 5)));
    g.fillStyle(C.blue, 0.18); g.fillRect(W/2-70, 4, 140, 18);
    g.fillStyle(C.blue, 0.60); g.fillRect(W/2-70, 4, zone * 35, 18);
    g.lineStyle(1, C.blue, 0.35); g.strokeRect(W/2-70, 4, 140, 18);

    // Textos
    this.hudDataVal.setText(`${this.dataCount}/${this.dataTotal}`);
    this.hudPtsVal.setText(String(this.score).padStart(5, '0'));
    this.hudZone.setText(`ZONA ${zone}/4`);

    const itemTxt =
      (this.items.double_jump ? '2xJMP ' : '      ') +
      (this.items.speed        ? 'VEL+ ' : '     ') +
      (this.items.shield       ? 'ESC'   : '   ');
    this.hudItems.setText(itemTxt);
    this.hudItems.setX(121);

    // Flash
    if (this.flashTimer > 0) {
      this.flashTimer--;
      this.hudFlash.setAlpha(Math.min(1, this.flashTimer / 18));
    } else {
      this.hudFlash.setAlpha(0);
    }
  }

  flash(txt, col) {
    this.hudFlash.setText(txt);
    this.hudFlash.setColor(col || '#00FFCC');
    this.flashTimer = 100;
  }

  /* ── Quiz UI (tudo dentro do canvas, Phaser) ─────────────────── */
  _initQuizUI() {
    const depth = 50;

    this.quizContainer = this.add.container(GW/2, GH/2).setScrollFactor(0).setDepth(depth).setVisible(false);

    this.quizBg   = this.add.graphics();
    this.quizBg.fillStyle(0x020810, 0.97); this.quizBg.fillRoundedRect(-310, -170, 620, 340, 10);
    this.quizBg.lineStyle(2, C.neon, 0.9); this.quizBg.strokeRoundedRect(-310, -170, 620, 340, 10);
    this.quizBg.lineStyle(1, C.neon, 0.2); this.quizBg.strokeRoundedRect(-306, -166, 612, 332, 8);

    this.quizLabel  = this.add.text(0, -150, 'TERMINAL — QUESTÃO DE HARDWARE', {
      fontFamily:'monospace', fontSize:'11px', color:'#00FFCC', letterSpacing:2
    }).setOrigin(0.5);

    this.quizQ = this.add.text(0, -100, '', {
      fontFamily:'monospace', fontSize:'16px', fontStyle:'bold',
      color:'#E6EDF3', wordWrap:{width:580}, align:'center',
    }).setOrigin(0.5);

    this.quizBtns = [];
    const btnY = [10, 60, 110];
    const letters = ['A', 'B', 'C'];
    for (let i = 0; i < 3; i++) {
      const bg = this.add.graphics();
      bg.fillStyle(0x0D1A2E, 1); bg.fillRoundedRect(-290, btnY[i]-18, 580, 36, 5);
      bg.lineStyle(1, 0x30363D, 1); bg.strokeRoundedRect(-290, btnY[i]-18, 580, 36, 5);
      const lbl = this.add.text(-274, btnY[i], letters[i]+')', {
        fontFamily:'monospace', fontSize:'13px', color:'#388BFD'
      }).setOrigin(0, 0.5);
      const opt = this.add.text(-250, btnY[i], '', {
        fontFamily:'monospace', fontSize:'13px', color:'#E6EDF3', wordWrap:{width:520}
      }).setOrigin(0, 0.5);
      const zone = this.add.zone(-290, btnY[i]-18, 580, 36).setOrigin(0, 0);
      zone.setInteractive({useHandCursor:true});
      zone.on('pointerover',  () => { bg.clear(); bg.fillStyle(0x003322,1); bg.fillRoundedRect(-290,btnY[i]-18,580,36,5); bg.lineStyle(1,C.neon,0.7); bg.strokeRoundedRect(-290,btnY[i]-18,580,36,5); });
      zone.on('pointerout',   () => { bg.clear(); bg.fillStyle(0x0D1A2E,1); bg.fillRoundedRect(-290,btnY[i]-18,580,36,5); bg.lineStyle(1,0x30363D,1); bg.strokeRoundedRect(-290,btnY[i]-18,580,36,5); });
      const idx = i;
      zone.on('pointerdown',  () => this._answerQuiz(idx));
      this.quizBtns.push({ bg, lbl, opt, zone });
    }

    this.quizReward = this.add.text(0, 150, '', {
      fontFamily:'monospace', fontSize:'11px', color:'#8B949E',
    }).setOrigin(0.5);

    this.quizContainer.add([
      this.quizBg, this.quizLabel, this.quizQ, this.quizReward,
      ...this.quizBtns.flatMap(b => [b.bg, b.lbl, b.opt, b.zone]),
    ]);

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
    this.quizReward.setText('Resposta certa desbloqueia: ' + q.itemName);

    this.quizContainer.setVisible(true);
    this.quizContainer.setAlpha(0);
    this.tweens.add({ targets:this.quizContainer, alpha:1, duration:200 });
  }

  _answerQuiz(idx) {
    if (!this._activeQuiz) return;
    const q = this._activeQuiz;
    const correct = idx === q.c;

    this.tweens.add({
      targets: this.quizContainer, alpha:0, duration:200,
      onComplete: () => {
        this.quizContainer.setVisible(false);
        this.quizOpen = false;
        this.physics.resume();
        this._activeQuiz = null;

        if (correct) {
          this.items[q.item] = true;
          this.score += 50;
          this.flash('CORRETO! +50 PTS — ' + q.itemName, '#00FFCC');
          this.cameras.main.flash(300, 0, 255, 180);
        } else {
          this.flash('INCORRETO — ' + q.opts[q.c], '#FF4444');
        }
      }
    });
  }

  /* ── Toast de zona ────────────────────────────────────────── */
  _showZoneToast(zone) {
    if (zone === this.zoneShown) return;
    this.zoneShown = zone;
    const names = [
      'ZONA 0 — TUTORIAL',
      'ZONA 1 — SERVIDORES',
      'ZONA 2 — MATRIZ',
      'ZONA 3 — FIREWALL CENTRAL',
      'ZONA 4 — PC CENTRAL',
    ];
    this.zoneToast.setText(names[zone] || '');
    this.tweens.killTweensOf(this.zoneToast);
    this.tweens.add({
      targets: this.zoneToast,
      alpha: { from:0, to:1 },
      duration:350, yoyo:true, hold:1600, ease:'Sine.easeInOut',
    });
  }

  /* ── Controles mobile ─────────────────────────────────────── */
  _setupMobile() {
    const set = (id, key, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart',  e => { e.preventDefault(); this[key] = val; }, {passive:false});
      el.addEventListener('touchend',    e => { e.preventDefault(); this[key] = !val; }, {passive:false});
      el.addEventListener('touchcancel', e => { e.preventDefault(); this[key] = !val; }, {passive:false});
    };
    set('btnLeft',  'mobileL', true);
    set('btnRight', 'mobileR', true);
    const btnJ = document.getElementById('btnJump');
    if (btnJ) {
      btnJ.addEventListener('touchstart',  e => { e.preventDefault(); this.mobileJ = true;  }, {passive:false});
      btnJ.addEventListener('touchend',    e => { e.preventDefault(); this.mobileJ = false; }, {passive:false});
      btnJ.addEventListener('touchcancel', e => { e.preventDefault(); this.mobileJ = false; }, {passive:false});
    }
  }

  /* ── Update principal ─────────────────────────────────────── */
  update(time, delta) {
    if (this.gameOver || this.won || this.quizOpen) return;

    const p    = this.player;
    const body = p.body;
    const onGnd = body.blocked.down;

    // Zona atual
    this._showZoneToast(Math.min(4, Math.floor(p.x / (WW / 5))));

    // Velocidade
    const spd = this.items.speed ? SPD_B : SPD_N;
    const goL = this.cursors.left.isDown  || this.wasd.A.isDown || this.mobileL;
    const goR = this.cursors.right.isDown || this.wasd.D.isDown || this.mobileR;

    if (goL)      { body.setVelocityX(-spd); p.setFlipX(true);  }
    else if (goR) { body.setVelocityX( spd); p.setFlipX(false); }
    else          { body.setVelocityX(body.velocity.x * 0.65); }

    // Salto com coyote time simples
    const jumpTriggered =
      Phaser.Input.Keyboard.JustDown(this.cursors.up)  ||
      Phaser.Input.Keyboard.JustDown(this.wasd.W)      ||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)  ||
      (!this._prevMobJump && this.mobileJ);

    if (jumpTriggered) {
      if (onGnd || (this.coyoteTime > 0)) {
        body.setVelocityY(JUMP1);
        this.extraJumps = this.items.double_jump ? 1 : 0;
        this.coyoteTime = 0;
      } else if (this.extraJumps > 0) {
        body.setVelocityY(JUMP2);
        this.extraJumps--;
      }
    }

    this._prevMobJump = this.mobileJ;

    // Coyote time
    if (!onGnd && this.wasGround) this.coyoteTime = 8;
    if (this.coyoteTime > 0) this.coyoteTime--;
    if (onGnd) this.extraJumps = this.items.double_jump ? 1 : 0;
    this.wasGround = onGnd;

    // Pisca se invencível
    if (this.invincible > 0) {
      this.invincible--;
      p.setAlpha(Math.floor(this.invincible / 6) % 2 === 0 ? 1 : 0.25);
    } else {
      p.setAlpha(1);
    }

    // Inimigos
    this._updateEnemies();

    // Coleta de dados
    this._updateData();

    // Firewalls
    this._updateFirewalls();

    // Checkpoints
    this._updateCheckpoints();

    // Terminais (quiz opcional)
    this._updateTerminals();

    // Meta (PC Central)
    this._updateGoal(time);
    if (!this.won && Phaser.Geom.Rectangle.Contains(this.goalZone, p.x, p.y)) {
      this._onVictory();
    }

    // Morte por queda
    if (p.y > 820) {
      this._respawn();
    }

    this._updateHUD();
  }

  _updateEnemies() {
    const p = this.player;
    this.enemyGroup.getChildren().forEach(en => {
      if (!en.getData('alive')) return;

      const startX = en.getData('startX');
      const range  = en.getData('range');
      const fast   = en.getData('fast');
      let dir      = en.getData('dir');
      const spd    = fast ? 100 : 65;

      if (en.x < startX - range || en.x > startX + range) {
        dir *= -1;
        en.setData('dir', dir);
      }
      en.body.setVelocityX(dir * spd);
      en.setFlipX(dir > 0);

      if (this.invincible > 0) return;
      if (!Phaser.Geom.Rectangle.Overlaps(p.getBounds(), en.getBounds())) return;

      const stomping = p.body.velocity.y > 60 && p.body.bottom < en.body.top + 12;
      if (stomping) {
        en.setData('alive', false);
        en.setVisible(false);
        en.body.enable = false;
        p.body.setVelocityY(JUMP1 * 0.65);
        this.score += 25;
        this.flash('VÍRUS DESTRUÍDO  +25', '#CC88FF');
        this.cameras.main.shake(150, 0.005);
      } else {
        this._takeDamage(false);
      }
    });
  }

  _updateData() {
    this.physics.overlap(this.player, this.dataGroup, (pl, d) => {
      d.destroy();
      this.dataCount++;
      this.score += 10;
      this.flash('DADO COLETADO  +10', '#00FFCC');
      this.cameras.main.flash(120, 0, 200, 150, true);
    });
  }

  _updateFirewalls() {
    if (this.invincible > 0) return;
    this.physics.overlap(this.player, this.fwGroup, () => {
      if (this.items.shield) {
        this.items.shield = false;
        this.flash('ESCUDO ATIVADO!', '#FFDD57');
        this.cameras.main.shake(200, 0.008);
        this.invincible = 40;
      } else {
        this._takeDamage(true);
        this.flash('FIREWALL!', '#FF4500');
      }
    });
  }

  _updateCheckpoints() {
    this.physics.overlap(this.player, this.cpGroup, (pl, cp) => {
      if (cp.getData('activated')) return;
      cp.setData('activated', true);
      cp.setTexture('tex_cp_on');
      this.lastCpX = cp.getData('ox');
      this.lastCpY = GY - 60;
      this.flash('CHECKPOINT SALVO!', '#FFDD57');
      this.cameras.main.flash(250, 255, 221, 87, false);
    });
  }

  _updateTerminals() {
    let nearTerminal = false;
    let nearQuizIdx  = -1;

    this.termGroup.getChildren().forEach(t => {
      const ti = t.getData('idx');
      if (this.usedTerminals.has(ti)) return;
      if (!Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(), t.getBounds())) return;
      nearTerminal = true;
      nearQuizIdx  = t.getData('quizIdx');

      // Verifica pressionamento de ↑ ou W para interagir
      const interact =
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.W);
      if (interact) {
        this.usedTerminals.add(ti);
        this._openQuiz(nearQuizIdx);
      }
    });

    if (nearTerminal) {
      this.termHint.setAlpha(Math.min(1, this.termHint.alpha + 0.08));
    } else {
      this.termHint.setAlpha(Math.max(0, this.termHint.alpha - 0.08));
    }
  }

  _takeDamage(isFirewall) {
    if (this.invincible > 0) return;
    this.energy--;
    this.invincible = 100;

    if (isFirewall) {
      this.player.body.setVelocityX(this.player.body.velocity.x > 0 ? -180 : 180);
      this.player.body.setVelocityY(-200);
    }

    this.cameras.main.shake(220, 0.01);
    this.cameras.main.flash(180, 200, 0, 0, true);

    if (this.energy <= 0) {
      this.gameOver = true;
      this.time.delayedCall(500, () => this.scene.start('EndScene', {
        win:false, score:this.score, data:this.dataCount, total:this.dataTotal
      }));
    } else {
      this.flash('DANO! (' + this.energy + ' HP)', '#FF4444');
    }
  }

  _respawn() {
    this.energy = Math.max(1, this.energy - 1);
    this.player.setPosition(this.lastCpX, this.lastCpY);
    this.player.body.setVelocity(0, 0);
    this.cameras.main.shake(300, 0.015);
    this.invincible = 90;
    this.flash('QUEDA!', '#FF4444');
    if (this.energy <= 0) {
      this.gameOver = true;
      this.time.delayedCall(400, () => this.scene.start('EndScene', {
        win:false, score:this.score, data:this.dataCount, total:this.dataTotal
      }));
    }
  }

  _onVictory() {
    this.won = true;
    salvarResultadoJogo(this.score);
    this.cameras.main.flash(600, 0, 255, 180);
    this.cameras.main.shake(300, 0.01);
    this.time.delayedCall(900, () => this.scene.start('EndScene', {
      win:true, score:this.score, data:this.dataCount, total:this.dataTotal
    }));
  }
}

/* ═══════════════════════════════════════════════════════════════
   CENA: EndScene — vitória / game over
═══════════════════════════════════════════════════════════════ */
class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }

  init(data) { this.result = data; }

  create() {
    const { win, score, data, total } = this.result;
    const cx = GW/2, cy = GH/2;

    // Fundo
    const bg = this.add.graphics();
    bg.fillGradientStyle(C.bg0, C.bg0, C.bg2, C.bg2, 1);
    bg.fillRect(0, 0, GW, GH);
    const grid = this.add.graphics();
    grid.lineStyle(0.5, C.neon, 0.04);
    for (let x=0;x<GW;x+=40) grid.lineBetween(x,0,x,GH);
    for (let y=0;y<GH;y+=40) grid.lineBetween(0,y,GW,y);

    // Overlay colorido
    if (win) {
      const ov = this.add.graphics();
      ov.fillStyle(C.neon, 0.04); ov.fillRect(0, 0, GW, GH);
    } else {
      const ov = this.add.graphics();
      ov.fillStyle(C.red, 0.06); ov.fillRect(0, 0, GW, GH);
    }

    // Painel central
    const panel = this.add.graphics();
    panel.fillStyle(0x060E1A, 0.97);
    panel.fillRoundedRect(cx-320, cy-220, 640, 440, 14);
    panel.lineStyle(2, win ? C.neon : C.red, 0.8);
    panel.strokeRoundedRect(cx-320, cy-220, 640, 440, 14);

    // Tag de status
    this.add.text(cx, cy-190, win ? 'MISSÃO CONCLUÍDA' : 'SISTEMA COMPROMETIDO', {
      fontFamily:'monospace', fontSize:'13px',
      color: win ? '#3FB950' : '#DA3633', letterSpacing:4,
    }).setOrigin(0.5);

    // Título
    const title = this.add.text(cx, cy-130, win ? 'PC CENTRAL' : 'GAME OVER', {
      fontFamily:'monospace', fontSize:'52px', fontStyle:'bold',
      color: win ? '#00FFCC' : '#FF4444',
      stroke: win ? '#003322' : '#330000', strokeThickness:4,
    }).setOrigin(0.5);
    this.tweens.add({ targets:title, alpha:{from:0.7,to:1}, duration:1000, yoyo:true, repeat:-1 });

    // Dados coletados
    this.add.text(cx, cy-60, `DADOS COLETADOS: ${data} / ${total}`, {
      fontFamily:'monospace', fontSize:'15px', color:'#58A6FF',
    }).setOrigin(0.5);

    // Score
    this.add.text(cx, cy+10, String(score), {
      fontFamily:'monospace', fontSize:'64px', fontStyle:'bold',
      color:'#FFFFFF',
    }).setOrigin(0.5);
    this.add.text(cx, cy+60, 'PONTOS', {
      fontFamily:'monospace', fontSize:'14px', color:'#8B949E', letterSpacing:3,
    }).setOrigin(0.5);

    // Rating
    const rating = score >= 1000 ? 'S' : score >= 700 ? 'A' : score >= 400 ? 'B' : score >= 200 ? 'C' : 'D';
    const ratCol = rating === 'S' ? '#FFD700' : rating === 'A' ? '#00FFCC' : rating === 'B' ? '#3FB950' : '#8B949E';
    this.add.text(cx+200, cy+10, rating, {
      fontFamily:'monospace', fontSize:'72px', fontStyle:'bold',
      color:ratCol, stroke:'#000', strokeThickness:3,
    }).setOrigin(0.5);

    // Linha separadora
    const line = this.add.graphics();
    line.lineStyle(1, win ? C.neon : C.red, 0.25);
    line.lineBetween(cx-280, cy+90, cx+280, cy+90);

    // Botão principal
    this._btn(cx - 80, cy+150, win ? 'JOGAR NOVAMENTE' : 'TENTAR NOVAMENTE',
      win ? C.neon : C.red, win ? 0x003322 : 0x330000,
      () => this.scene.start('GameScene'));

    // Botão menu
    this._btn(cx + 160, cy+150, 'MENU', 0x8B949E, 0x0D1520,
      () => this.scene.start('StartScene'));
  }

  _btn(x, y, label, col, bg, cb) {
    const w = label.length * 9 + 32, h = 40;
    const rect = this.add.rectangle(x, y, w, h, bg, 1)
      .setStrokeStyle(2, col)
      .setInteractive({useHandCursor:true});
    const txt = this.add.text(x, y, label, {
      fontFamily:'monospace', fontSize:'14px', fontStyle:'bold',
      color: '#' + col.toString(16).padStart(6,'0'),
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    const ho = () => rect.setFillStyle(col, 0.2);
    const le = () => rect.setFillStyle(bg, 1);
    rect.on('pointerover', ho); rect.on('pointerout', le); rect.on('pointerdown', cb);
    txt.on('pointerover',  ho); txt.on('pointerout',  le); txt.on('pointerdown', cb);
  }
}

/* ═══════════════════════════════════════════════════════════════
   Config e inicialização
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
  scene: [StartScene, GameScene, EndScene],
});
