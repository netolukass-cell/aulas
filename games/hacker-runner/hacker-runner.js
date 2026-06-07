'use strict';
// ── Hacker Runner v4 — Phaser 3 ──────────────────────────────

function voltarPlataforma() { window.location.href = '../../index.html'; }
function lerAlunoId() { return new URLSearchParams(window.location.search).get('alunoId') || ''; }
function salvarResultadoJogo(pts) {
  localStorage.setItem('lusca_pending_game_result', JSON.stringify({
    alunoId: lerAlunoId(),
    gameId: 'hacker-runner',
    moduloId: new URLSearchParams(window.location.search).get('moduloId') || 'hardware',
    status: 'completed', score: pts,
    timestamp: new Date().toISOString()
  }));
}

// ── QUIZ ──────────────────────────────────────────────────────
const QUIZ = [
  {q:'O que define HARDWARE?',opts:['Programas instalados no PC','Parte física que podemos tocar','A conexão com a internet'],c:1,item:'double_jump',itemName:'SALTO DUPLO'},
  {q:'CPU é o "cérebro" do computador. CPU significa:',opts:['Central Processing Unit','Computer Power Unit','Control Program Utility'],c:0,item:'speed',itemName:'SUPER VELOCIDADE'},
  {q:'Qual componente guarda dados temporariamente enquanto o PC funciona?',opts:['HD (disco rígido)','Placa de vídeo','Memória RAM'],c:2,item:'shield',itemName:'ESCUDO'},
  {q:'Teclado é um hardware de:',opts:['Saída (mostra resultado)','Entrada (manda dados pro PC)','Processamento'],c:1,item:'double_jump',itemName:'SALTO DUPLO'},
  {q:'Monitor é um hardware de:',opts:['Entrada','Processamento','Saída (exibe resultado)'],c:2,item:'speed',itemName:'SUPER VELOCIDADE'},
  {q:'SSD e HD são dispositivos de:',opts:['Processamento','Armazenamento permanente','Entrada de dados'],c:1,item:'shield',itemName:'ESCUDO'},
  {q:'Placa-mãe serve para:',opts:['Exibir imagens na tela','Conectar todos os componentes','Guardar arquivos'],c:1,item:'double_jump',itemName:'SALTO DUPLO'},
  {q:'O que é um periférico?',opts:['Hardware extra conectado ao PC','Tipo de vírus','Programa de segurança'],c:0,item:'speed',itemName:'SUPER VELOCIDADE'},
  {q:'Qual componente é responsável pelo processamento gráfico?',opts:['RAM','GPU (Placa de vídeo)','Fonte de alimentação'],c:1,item:'shield',itemName:'ESCUDO'},
  {q:'Fonte de alimentação serve para:',opts:['Armazenar arquivos','Converter energia elétrica para o PC','Conectar ao Wi-Fi'],c:1,item:'double_jump',itemName:'SALTO DUPLO'},
  {q:'Mouse é um hardware de:',opts:['Saída','Armazenamento','Entrada'],c:2,item:'speed',itemName:'SUPER VELOCIDADE'},
  {q:'Qual é a unidade básica de armazenamento digital?',opts:['Pixel','Bit','Hertz'],c:1,item:'shield',itemName:'ESCUDO'},
];

// ── LEVEL LAYOUT ──────────────────────────────────────────────
// Cada zona tem ~2000px de largura. 5 zonas = ~10000px total
// formato: { type, x, y, w, h, ... }
function buildLevel() {
  const platforms = [];
  const enemies = [];
  const collectibles = [];
  const firewalls = [];
  const checkpoints = [];
  const GROUND_Y = 520;
  const TH = 24; // tile height

  function ground(x, w) { platforms.push({ x, y: GROUND_Y, w, h: TH, isGround: true }); }
  function plat(x, y, w) { platforms.push({ x, y, w, h: TH, isGround: false }); }
  function enemy(x, y, range, fast) { enemies.push({ x, y, range: range||120, fast: !!fast }); }
  function data(x, y) { collectibles.push({ x, y }); }
  function fw(x) { firewalls.push({ x, y: GROUND_Y - 80, h: 80 }); }
  function cp(x) { checkpoints.push({ x, y: GROUND_Y - 64 }); }

  // ── ZONA 0: Tutorial (0–1800) ──
  ground(0, 600);
  data(180, GROUND_Y - 40); data(300, GROUND_Y - 40); data(420, GROUND_Y - 40);
  plat(650, GROUND_Y - 80, 100); data(690, GROUND_Y - 120);
  ground(780, 400);
  enemy(900, GROUND_Y - 32, 100);
  data(1000, GROUND_Y - 40);
  plat(1200, GROUND_Y - 80, 80); data(1230, GROUND_Y - 120);
  plat(1320, GROUND_Y - 140, 80); data(1350, GROUND_Y - 180);
  ground(1440, 360);
  data(1500, GROUND_Y - 40);
  enemy(1620, GROUND_Y - 32, 80);
  cp(1700);

  // ── ZONA 1: Servidores (1800–3800) ──
  ground(1800, 300);
  fw(2000); fw(2120);
  ground(2160, 200);
  data(2200, GROUND_Y - 40);
  plat(2400, GROUND_Y - 90, 100); data(2440, GROUND_Y - 130);
  plat(2540, GROUND_Y - 170, 80); data(2570, GROUND_Y - 210);
  plat(2660, GROUND_Y - 110, 100); data(2700, GROUND_Y - 150);
  ground(2800, 500);
  enemy(2850, GROUND_Y - 32, 120); enemy(3000, GROUND_Y - 32, 80);
  data(2900, GROUND_Y - 40); data(3050, GROUND_Y - 40);
  fw(3150); fw(3220);
  ground(3280, 200);
  plat(3500, GROUND_Y - 80, 120); data(3550, GROUND_Y - 120);
  plat(3660, GROUND_Y - 150, 80); data(3690, GROUND_Y - 190);
  ground(3780, 150);
  cp(3820);

  // ── ZONA 2: Matriz (3800–5800) ──
  ground(3950, 250);
  enemy(3980, GROUND_Y - 32, 100, true);
  data(4050, GROUND_Y - 40); data(4100, GROUND_Y - 40);
  fw(4220); fw(4320); fw(4420);
  ground(4500, 180);
  plat(4700, GROUND_Y - 110, 100); data(4740, GROUND_Y - 150);
  plat(4840, GROUND_Y - 80, 80);
  plat(4960, GROUND_Y - 150, 100); data(5000, GROUND_Y - 190);
  ground(5100, 400);
  enemy(5150, GROUND_Y - 32, 140, true); enemy(5300, GROUND_Y - 32, 80, true);
  data(5200, GROUND_Y - 40); data(5350, GROUND_Y - 40);
  fw(5480);
  ground(5560, 200);
  plat(5780, GROUND_Y - 100, 80); data(5810, GROUND_Y - 140);
  cp(5850);

  // ── ZONA 3: Firewall Central (5800–7800) ──
  ground(5960, 200);
  fw(6060); fw(6130); fw(6200); fw(6280);
  ground(6380, 150);
  plat(6550, GROUND_Y - 90, 100); data(6590, GROUND_Y - 130);
  plat(6690, GROUND_Y - 170, 80); data(6720, GROUND_Y - 210);
  plat(6820, GROUND_Y - 110, 120); data(6870, GROUND_Y - 150);
  ground(6980, 300);
  enemy(7000, GROUND_Y - 32, 120, true); enemy(7120, GROUND_Y - 32, 80, true); enemy(7230, GROUND_Y - 32, 100);
  data(7050, GROUND_Y - 40); data(7160, GROUND_Y - 40);
  fw(7350); fw(7440); fw(7530);
  ground(7620, 180);
  data(7680, GROUND_Y - 40);
  cp(7720);

  // ── ZONA 4: PC Central (7800–9600) ──
  ground(7800, 200);
  enemy(7830, GROUND_Y - 32, 80, true);
  fw(8020); fw(8100); fw(8190); fw(8280); fw(8370);
  ground(8500, 200);
  plat(8720, GROUND_Y - 100, 80); data(8750, GROUND_Y - 140);
  plat(8840, GROUND_Y - 160, 80); data(8870, GROUND_Y - 200);
  plat(8960, GROUND_Y - 110, 80); data(8990, GROUND_Y - 150);
  ground(9080, 300);
  enemy(9100, GROUND_Y - 32, 100, true); enemy(9220, GROUND_Y - 32, 80, true); enemy(9320, GROUND_Y - 32, 60, true);
  data(9150, GROUND_Y - 40); data(9260, GROUND_Y - 40);
  // Final stretch
  ground(9440, 400);
  data(9500, GROUND_Y - 40); data(9560, GROUND_Y - 40); data(9620, GROUND_Y - 40);
  // goal at 9850
  ground(9840, 300);

  return { platforms, enemies, collectibles, firewalls, checkpoints,
    playerStart: { x: 80, y: GROUND_Y - 48 },
    goalX: 9900, goalY: GROUND_Y - 96,
    levelWidth: 10200, levelHeight: 600 };
}

// ── PHASER GAME ───────────────────────────────────────────────
let phaserGame = null;
let gameScore = 0;
let gameItems = { double_jump: false, speed: false, shield: false };
let quizQueue = [];
let quizIdx = 0;
let dataCollected = 0;
let dataForQuiz = 0;
let totalData = 0;
let gameScene = null;

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    gameScene = this;
    const LVL = buildLevel();
    this.LVL = LVL;
    this.levelWidth = LVL.levelWidth;

    totalData = LVL.collectibles.length;
    dataCollected = 0; dataForQuiz = 0;
    gameScore = 0;
    gameItems = { double_jump: false, speed: false, shield: false };
    quizQueue = [...QUIZ].sort(() => Math.random() - 0.5);
    quizIdx = 0;
    this.gameOver = false;
    this.won = false;
    this.playerEnergy = 5;
    this.playerInvincible = 0;
    this.extraJumps = 0;
    this.lastCheckpointX = LVL.playerStart.x;
    this.lastCheckpointY = LVL.playerStart.y;
    this.quizPaused = false;
    this.zoneLabel = null;
    this.zoneLabelTimer = 0;

    // ── World bounds ──
    this.physics.world.setBounds(0, 0, LVL.levelWidth, LVL.levelHeight + 200);
    this.cameras.main.setBounds(0, 0, LVL.levelWidth, LVL.levelHeight + 200);

    // ── Background ──
    this.createBackground();

    // ── Platforms ──
    this.platforms = this.physics.add.staticGroup();
    for (const p of LVL.platforms) {
      const gfx = this.add.graphics();
      this.drawPlatformGfx(gfx, p);
      const key = 'plat_' + p.x + '_' + p.y;
      gfx.generateTexture(key, p.w, p.h);
      gfx.destroy();
      const sprite = this.platforms.create(p.x + p.w / 2, p.y + p.h / 2, key);
      sprite.setImmovable(true);
      sprite.refreshBody();
    }

    // ── Firewalls ──
    this.firewallGroup = this.physics.add.staticGroup();
    this.firewallGfxList = [];
    for (const fw of LVL.firewalls) {
      const gfx = this.add.graphics();
      this.firewallGfxList.push({ gfx, fw });
      gfx.fillStyle(0xFF3300, 0.85);
      gfx.fillRect(0, 0, 20, fw.h);
      gfx.lineStyle(2, 0xFF6600, 1);
      gfx.strokeRect(0, 0, 20, fw.h);
      const key = 'fw_' + fw.x;
      gfx.generateTexture(key, 20, fw.h);
      gfx.destroy();
      const spr = this.firewallGroup.create(fw.x + 10, fw.y + fw.h / 2, key);
      spr.setImmovable(true);
      spr.refreshBody();
      // animated overlay gfx
      const ogfx = this.add.graphics();
      ogfx.x = fw.x;
      ogfx.y = fw.y;
      this.firewallGfxList[this.firewallGfxList.length - 1].ogfx = ogfx;
    }

    // ── Collectibles ──
    this.dataGroup = this.physics.add.staticGroup();
    this.dataGfxMap = new Map();
    for (const d of LVL.collectibles) {
      const key = 'data_pkg';
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        g.fillStyle(0x00FFCC, 1); g.fillRect(2, 2, 12, 12);
        g.fillStyle(0xFFFFFF, 0.6); g.fillRect(3, 3, 4, 4);
        g.generateTexture(key, 16, 16); g.destroy();
      }
      const spr = this.dataGroup.create(d.x + 8, d.y + 8, key);
      spr.setImmovable(true); spr.refreshBody();
      this.dataGfxMap.set(spr, { t: Math.random() * 6.28 });
    }

    // ── Checkpoints ──
    this.checkpointGroup = this.physics.add.staticGroup();
    for (const cp of LVL.checkpoints) {
      if (!this.textures.exists('cp_off')) {
        const g = this.add.graphics();
        g.fillStyle(0x586069, 1); g.fillRect(6, 0, 4, 40);
        g.fillStyle(0x8B949E, 1); g.fillRect(10, 0, 16, 12);
        g.generateTexture('cp_off', 26, 40); g.destroy();
      }
      if (!this.textures.exists('cp_on')) {
        const g = this.add.graphics();
        g.fillStyle(0x3FB950, 1); g.fillRect(6, 0, 4, 40);
        g.fillStyle(0x5CD672, 1); g.fillRect(10, 0, 16, 12);
        g.generateTexture('cp_on', 26, 40); g.destroy();
      }
      const spr = this.checkpointGroup.create(cp.x + 13, cp.y + 20, 'cp_off');
      spr.setData('activated', false);
      spr.setData('cpx', cp.x); spr.setData('cpy', cp.y);
      spr.setImmovable(true); spr.refreshBody();
    }

    // ── Enemies ──
    this.enemyGroup = this.physics.add.group();
    for (const en of LVL.enemies) {
      const key = en.fast ? 'enemy_fast' : 'enemy_slow';
      if (!this.textures.exists(key)) {
        const g = this.add.graphics();
        const col = en.fast ? 0x8B1A4A : 0x4E1580;
        const col2 = en.fast ? 0xCC2266 : 0x7B2FBE;
        g.fillStyle(col, 1); g.fillRect(2, 5, 12, 11); g.fillRect(4, 2, 8, 14);
        g.fillStyle(col2, 1); g.fillRect(0, 6, 2, 5); g.fillRect(14, 6, 2, 5); g.fillRect(5, 0, 4, 2);
        g.fillStyle(0xFF3333, 1); g.fillRect(3, 5, 3, 3); g.fillRect(10, 5, 3, 3);
        g.generateTexture(key, 16, 16); g.destroy();
      }
      const spr = this.enemyGroup.create(en.x + 8, en.y - 8, key);
      spr.setCollideWorldBounds(false);
      spr.setData('startX', en.x);
      spr.setData('range', en.range);
      spr.setData('fast', en.fast);
      spr.setData('dir', -1);
      spr.setData('alive', true);
      spr.body.setVelocityX(en.fast ? -90 : -60);
      spr.body.allowGravity = false;
    }

    // ── Goal (PC Central) ──
    this.goal = this.add.graphics();
    this.goal.x = LVL.goalX;
    this.goal.y = LVL.goalY;
    this.goalZone = this.add.zone(LVL.goalX + 24, LVL.goalY + 48, 48, 96);
    this.physics.world.enable(this.goalZone);
    this.goalZone.body.setImmovable(true);

    // ── Player ──
    if (!this.textures.exists('player')) {
      const g = this.add.graphics();
      // body
      g.fillStyle(0x1E2C40, 1); g.fillRect(2, 9, 8, 11);
      // neon strips
      g.fillStyle(0x00FFCC, 1); g.fillRect(2, 10, 1, 7); g.fillRect(9, 10, 1, 7);
      // hood
      g.fillStyle(0x1A2638, 1); g.fillRect(2, 2, 8, 9);
      // visor
      g.fillStyle(0x0099EE, 1); g.fillRect(3, 5, 6, 3);
      g.fillStyle(0x00DDFF, 0.7); g.fillRect(3, 5, 6, 1);
      // legs
      g.fillStyle(0x18222F, 1); g.fillRect(3, 18, 3, 4); g.fillRect(7, 18, 3, 4);
      // shoes
      g.fillStyle(0x00DD88, 1); g.fillRect(7, 21, 4, 1);
      g.generateTexture('player', 12, 22);
      g.destroy();
    }

    this.player = this.physics.add.sprite(LVL.playerStart.x, LVL.playerStart.y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(400);
    this.player.setDepth(5);

    // ── Colliders ──
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemyGroup, this.platforms);

    // ── Camera ──
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    // ── Controls ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: 'W', left: 'A', right: 'D', jump: 'SPACE' });
    this.jumpPressed = false;
    this.mobileLeft = false;
    this.mobileRight = false;
    this.mobileJump = false;
    this.setupMobileControls();

    // ── HUD ──
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(10);
    this.hudTexts = {};
    const hudStyle = { fontFamily: 'monospace', fontSize: '10px', color: '#00FFCC', resolution: 2 };
    this.hudTexts.hp = this.add.text(4, 4, '', hudStyle).setScrollFactor(0).setDepth(11);
    this.hudTexts.data = this.add.text(120, 4, '', hudStyle).setScrollFactor(0).setDepth(11);
    this.hudTexts.score = this.add.text(this.cameras.main.width - 80, 4, '', hudStyle).setScrollFactor(0).setDepth(11);
    this.hudTexts.items = this.add.text(220, 4, '', hudStyle).setScrollFactor(0).setDepth(11);
    this.hudTexts.zone = this.add.text(this.cameras.main.width / 2, 4, '', { fontFamily: 'monospace', fontSize: '9px', color: '#58A6FF', resolution: 2 }).setScrollFactor(0).setDepth(11).setOrigin(0.5, 0);

    // ── Flash text ──
    this.flashText = this.add.text(this.cameras.main.width / 2, 28, '', {
      fontFamily: 'monospace', fontSize: '9px', color: '#00FFCC',
      stroke: '#000', strokeThickness: 2, resolution: 2
    }).setScrollFactor(0).setDepth(12).setOrigin(0.5, 0);
    this.flashTimer = 0;

    // ── Zone toast ──
    this.zoneToast = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, '', {
      fontFamily: 'monospace', fontSize: '20px', fontStyle: 'bold',
      color: '#00FFCC', stroke: '#003322', strokeThickness: 3, resolution: 2
    }).setScrollFactor(0).setDepth(15).setOrigin(0.5, 0.5).setAlpha(0);

    this.lastZone = -1;
    this.showZoneToast(0);

    // ── Particles (emitter) ──
    // We'll draw particles manually via graphics for simplicity
    this.particleList = [];

    // ── Draw goal ──
    this.drawGoal();
  }

  drawPlatformGfx(gfx, p) {
    if (p.isGround) {
      gfx.fillStyle(0x081520, 1); gfx.fillRect(0, 0, p.w, p.h);
      gfx.fillStyle(0x0C2240, 1); gfx.fillRect(1, 1, p.w - 2, p.h - 2);
      gfx.fillStyle(0x00C8A0, 0.3);
      for (let x = 2; x < p.w - 2; x += 16) { gfx.fillRect(x, p.h - 4, 12, 1); }
      gfx.fillStyle(0x388BFD, 0.55); gfx.fillRect(0, 0, p.w, 1);
      gfx.fillStyle(0x00FFCC, 0.45); gfx.fillRect(0, 0, p.w, 1);
    } else {
      gfx.fillStyle(0x111E30, 1); gfx.fillRect(0, 0, p.w, p.h);
      gfx.fillStyle(0x1A2D46, 1); gfx.fillRect(1, 1, p.w - 2, p.h - 2);
      gfx.fillStyle(0x50A0E6, 0.55); gfx.fillRect(0, 0, p.w, 2);
      gfx.fillStyle(0x00FFCC, 0.25); gfx.fillRect(0, 0, p.w, 1);
      gfx.fillStyle(0x000000, 0.35); gfx.fillRect(2, 4, p.w - 4, 2); gfx.fillRect(2, 9, p.w - 4, 2);
    }
  }

  createBackground() {
    // Dark gradient sky — use a big rectangle
    const bg = this.add.graphics().setScrollFactor(0).setDepth(-10);
    const W = this.cameras.main.width, H = this.cameras.main.height;
    bg.fillGradientStyle(0x020810, 0x020810, 0x0A1530, 0x0A1530, 1);
    bg.fillRect(0, 0, W, H);

    // Grid lines (scrolling with camera at 0.3 speed)
    this.bgGrid = this.add.graphics().setScrollFactor(0.3).setDepth(-9);
    this.bgGrid.lineStyle(0.5, 0x00FFCC, 0.05);
    for (let x = 0; x < this.LVL.levelWidth + 64; x += 32) {
      this.bgGrid.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y < 600; y += 32) {
      this.bgGrid.lineBetween(0, y, this.LVL.levelWidth + 64, y);
    }

    // Buildings (parallax layer)
    this.bgBuildings = this.add.graphics().setScrollFactor(0.15).setDepth(-8);
    const bldData = [14,58,20,85,10,38,24,100,16,62,18,75,10,42,22,90,14,55,20,68,16,82,12,44,18,62,24,110,10,50,20,78,16,65,22,95];
    let bx = 0;
    for (let i = 0; i < bldData.length; i += 2) {
      const bw = bldData[i], bh = bldData[i + 1];
      const by = 520 - bh - 36;
      this.bgBuildings.fillStyle(0x040F24, 0.85);
      this.bgBuildings.fillRect(bx, by, bw, bh);
      this.bgBuildings.fillStyle(0x143250, 0.4);
      for (let ry = by + 3; ry < by + bh - 3; ry += 8) {
        this.bgBuildings.fillRect(bx + 1, ry, bw - 2, 5);
      }
      bx += bw + 10;
    }
  }

  drawGoal() {
    const g = this.goal;
    g.clear();
    const t = this.time.now * 0.001;
    const gl = 0.55 + Math.sin(t) * 0.3;
    g.fillStyle(0x00FFB4, gl * 0.12); g.fillRect(-8, -6, 64, 108);
    g.lineStyle(2, 0x00FF99, gl * 0.55); g.strokeRect(-4, -2, 56, 100);
    g.fillStyle(0x0A1828, 1); g.fillRect(0, 8, 48, 88);
    g.fillStyle(0x142030, 1); g.fillRect(1, 9, 46, 86);
    g.fillStyle(0x00FF99, gl * 0.9); g.fillRect(4, 14, 40, 68);
    g.fillStyle(0x000000, 0.18);
    for (let sy = 14; sy < 82; sy += 3) g.fillRect(4, sy, 40, 1);
    g.fillStyle(0xDCFFEB, gl); g.fillRect(8, 20, 4, 4); g.fillRect(8, 28, 4, 4);
  }

  setupMobileControls() {
    const btnL = document.getElementById('btnLeft');
    const btnR = document.getElementById('btnRight');
    const btnJ = document.getElementById('btnJump');
    if (!btnL) return;
    const s = (el, key, val) => {
      el.addEventListener('touchstart', e => { e.preventDefault(); this[key] = val; }, { passive: false });
      el.addEventListener('touchend', e => { e.preventDefault(); if (val === true) this[key] = false; }, { passive: false });
    };
    s(btnL, 'mobileLeft', true); s(btnR, 'mobileRight', true);
    btnJ.addEventListener('touchstart', e => { e.preventDefault(); this.mobileJump = true; }, { passive: false });
    btnJ.addEventListener('touchend', e => { e.preventDefault(); this.mobileJump = false; }, { passive: false });
  }

  flash(txt, col) {
    this.flashText.setText(txt);
    this.flashText.setColor(col || '#00FFCC');
    this.flashTimer = 100;
  }

  showZoneToast(zone) {
    if (zone === this.lastZone) return;
    this.lastZone = zone;
    const names = ['ZONA 0 — TUTORIAL', 'ZONA 1 — SERVIDORES', 'ZONA 2 — MATRIZ', 'ZONA 3 — FIREWALL CENTRAL', 'ZONA 4 — PC CENTRAL'];
    this.zoneToast.setText(names[zone] || '');
    this.tweens.add({ targets: this.zoneToast, alpha: { from: 0, to: 1 }, duration: 400, yoyo: true, hold: 1400, ease: 'Sine.easeInOut' });
  }

  spawnParticles(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      this.particleList.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, col, life: 20 + Math.random() * 20 | 0, maxLife: 40, size: 1 + Math.random() * 2 | 0 });
    }
  }

  update() {
    if (this.gameOver || this.won || this.quizPaused) return;

    const p = this.player;
    const body = p.body;
    const onGround = body.blocked.down;

    // Zone detection
    const zone = Math.min(4, Math.floor(p.x / 2000));
    this.showZoneToast(zone);

    // Speed
    const spd = gameItems.speed ? 230 : 170;
    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.mobileLeft;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.mobileRight;
    const jumpKey = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.jump) ||
      this.mobileJump;

    if (left) { body.setVelocityX(-spd); p.setFlipX(true); }
    else if (right) { body.setVelocityX(spd); p.setFlipX(false); }
    else { body.setVelocityX(body.velocity.x * 0.7); }

    // Mobile jump: edge-trigger
    if (this.mobileJump && !this._prevMobileJump) {
      if (onGround) { body.setVelocityY(-520); this.extraJumps = gameItems.double_jump ? 1 : 0; }
      else if (this.extraJumps > 0) { this.extraJumps--; body.setVelocityY(-480); }
    }
    this._prevMobileJump = this.mobileJump;

    if (jumpKey) {
      if (onGround) { body.setVelocityY(-520); this.extraJumps = gameItems.double_jump ? 1 : 0; }
      else if (this.extraJumps > 0) { this.extraJumps--; body.setVelocityY(-480); }
    }

    if (onGround && !this._wasOnGround) this.extraJumps = gameItems.double_jump ? 1 : 0;
    this._wasOnGround = onGround;

    // Invincibility
    if (this.playerInvincible > 0) {
      this.playerInvincible--;
      p.setAlpha(Math.floor(this.playerInvincible / 6) % 2 === 0 ? 1 : 0.3);
    } else { p.setAlpha(1); }

    // Enemies
    this.enemyGroup.getChildren().forEach(en => {
      if (!en.getData('alive')) return;
      const startX = en.getData('startX');
      const range = en.getData('range');
      const fast = en.getData('fast');
      const spd2 = fast ? 90 : 60;
      let dir = en.getData('dir');
      if (en.x < startX - range || en.x > startX + range) {
        dir *= -1; en.setData('dir', dir);
      }
      en.body.setVelocityX(dir * spd2);
      en.setFlipX(dir > 0);

      // Player collision
      if (this.playerInvincible === 0 && Phaser.Geom.Rectangle.Overlaps(p.getBounds(), en.getBounds())) {
        const stomping = body.velocity.y > 0 && p.y + 20 < en.y;
        if (stomping) {
          en.setData('alive', false);
          en.setVisible(false);
          en.body.enable = false;
          body.setVelocityY(-380);
          gameScore += 25;
          this.spawnParticles(en.x, en.y, '#9B59B6', 12);
          this.flash('VÍRUS DESTRUÍDO  +25', '#CC88FF');
        } else if (this.playerInvincible === 0) {
          this.takeDamage();
        }
      }
    });

    // Collectibles
    this.physics.overlap(this.player, this.dataGroup, (pl, d) => {
      d.destroy();
      dataCollected++; dataForQuiz++; gameScore += 10;
      this.spawnParticles(d.x, d.y, '#00FFCC', 8);
      this.flash('DADO COLETADO  +10', '#00FFCC');
      if (dataForQuiz % 3 === 0 && quizIdx < quizQueue.length) {
        this.time.delayedCall(350, () => this.triggerQuiz());
      }
    });

    // Firewalls
    this.physics.overlap(this.player, this.firewallGroup, () => {
      if (this.playerInvincible > 0) return;
      if (gameItems.shield) {
        gameItems.shield = false;
        this.flash('ESCUDO ATIVADO!', '#FFDD57');
        this.cameras.main.shake(200, 0.008);
      } else {
        this.takeDamage(true);
        this.flash('FIREWALL!', '#FF4500');
        this.cameras.main.shake(250, 0.012);
      }
    });

    // Checkpoints
    this.physics.overlap(this.player, this.checkpointGroup, (pl, cp) => {
      if (!cp.getData('activated')) {
        cp.setData('activated', true);
        cp.setTexture('cp_on');
        this.lastCheckpointX = cp.getData('cpx');
        this.lastCheckpointY = cp.getData('cpy') - 48;
        this.flash('CHECKPOINT SALVO!', '#FFDD57');
        this.spawnParticles(cp.x, cp.y, '#FFDD57', 14);
        this.cameras.main.flash(300, 255, 221, 87, false, null, this);
      }
    });

    // Goal
    if (Phaser.Geom.Rectangle.Overlaps(p.getBounds(), new Phaser.Geom.Rectangle(this.LVL.goalX, this.LVL.goalY, 48, 96))) {
      this.won = true;
      gameScore += 200;
      salvarResultadoJogo(gameScore);
      this.spawnParticles(p.x, p.y, '#00FFCC', 20);
      this.cameras.main.flash(500, 0, 255, 200);
      this.time.delayedCall(700, () => this.showEnd(true));
    }

    // Void death
    if (p.y > this.LVL.levelHeight + 100) {
      this.playerEnergy = Math.max(1, this.playerEnergy - 1);
      p.setPosition(this.lastCheckpointX, this.lastCheckpointY);
      body.setVelocity(0, 0);
      this.cameras.main.shake(300, 0.015);
      this.flash('QUEDA!', '#FF4444');
      this.playerInvincible = 90;
    }

    // Particles update
    this.particleList = this.particleList.filter(pt => pt.life > 0);
    this.particleList.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.2; pt.life--; });

    // Flash timer
    if (this.flashTimer > 0) { this.flashTimer--; this.flashText.setAlpha(Math.min(1, this.flashTimer / 18)); }
    else { this.flashText.setAlpha(0); }

    // Goal animation
    this.drawGoal();

    // Update HUD
    this.updateHUD();
  }

  takeDamage(isFirewall) {
    this.playerEnergy--;
    this.playerInvincible = 100;
    if (isFirewall) {
      const p = this.player;
      p.body.setVelocityX(p.body.velocity.x > 0 ? -200 : 200);
      p.body.setVelocityY(-180);
    }
    this.spawnParticles(this.player.x, this.player.y, '#DA3633', 8);
    if (this.playerEnergy <= 0) {
      this.gameOver = true;
      this.time.delayedCall(500, () => this.showEnd(false));
    }
  }

  updateHUD() {
    const W = this.cameras.main.width;
    const h = this.hud;
    h.clear();
    h.fillStyle(0x020612, 0.85); h.fillRect(0, 0, W, 20);
    h.lineStyle(1, 0x00FFCC, 0.15); h.lineBetween(0, 20, W, 20);

    // HP boxes
    h.lineStyle(1, 0x00FFCC, 0.25); h.strokeRect(4, 3, 5 * 14 + 2, 14);
    for (let i = 0; i < 5; i++) {
      const filled = i < this.playerEnergy;
      h.fillStyle(filled ? (this.playerEnergy > 3 ? 0x3FB950 : this.playerEnergy > 1 ? 0xD29922 : 0xDA3633) : 0x141F33, 0.9);
      h.fillRect(5 + i * 14, 4, 12, 12);
    }

    // Items
    const items = [
      { key: 'double_jump', label: '2xJMP', col: 0x00FFCC },
      { key: 'speed', label: 'VEL+', col: 0xFFDD57 },
      { key: 'shield', label: 'ESC', col: 0xFF9944 },
    ];
    items.forEach((it, i) => {
      const x = 82 + i * 38, y = 3;
      const active = gameItems[it.key];
      h.fillStyle(it.col, active ? 0.18 : 0.06); h.fillRect(x, y, 34, 14);
      h.lineStyle(1, it.col, active ? 0.9 : 0.25); h.strokeRect(x, y, 34, 14);
    });

    // Zone bar
    const zoneX = Math.min(4, Math.floor(this.player.x / 2000));
    h.fillStyle(0x388BFD, 0.25); h.fillRect(W / 2 - 60, 3, 120, 14);
    h.fillStyle(0x388BFD, 0.7); h.fillRect(W / 2 - 60, 3, zoneX * 30, 14);
    h.lineStyle(1, 0x388BFD, 0.4); h.strokeRect(W / 2 - 60, 3, 120, 14);

    this.hudTexts.hp.setText('HP');
    this.hudTexts.data.setText(`DADOS ${dataCollected}/${totalData}`);
    this.hudTexts.data.setX(82 + 3 * 38 + 6);
    this.hudTexts.score.setText(`PTS ${String(gameScore).padStart(5, '0')}`);
    this.hudTexts.score.setX(W - 78);
    this.hudTexts.items.setText(
      (gameItems.double_jump ? '2xJMP ' : '      ') +
      (gameItems.speed ? 'VEL+ ' : '     ') +
      (gameItems.shield ? 'ESC' : '   ')
    );
    this.hudTexts.items.setX(83);
    this.hudTexts.zone.setX(W / 2);
    this.hudTexts.zone.setText(`ZONA ${zoneX}/4`);
  }

  triggerQuiz() {
    if (quizIdx >= quizQueue.length) return;
    const q = quizQueue[quizIdx++];
    this.quizPaused = true;
    this.player.body.setVelocity(0, 0);
    const el = document.getElementById('hrQuestion');
    el.style.display = 'block';
    el.innerHTML = `
      <div style="font-size:clamp(8px,1.1vw,10px);color:#00FFCC;letter-spacing:2px;margin-bottom:8px;">DADO COLETADO — QUESTÃO DE HARDWARE</div>
      <div style="font-size:clamp(11px,1.9vw,15px);font-weight:700;color:#E6EDF3;margin-bottom:14px;line-height:1.4;">${q.q}</div>
      ${q.opts.map((o, i) => `
      <button onclick="window.hrAnswerQuiz(${i})" style="display:block;width:100%;margin-bottom:7px;background:#0D1A2E;border:1px solid #30363D;color:#E6EDF3;font-family:inherit;font-size:clamp(10px,1.6vw,13px);padding:8px 12px;border-radius:4px;cursor:pointer;text-align:left;letter-spacing:0.5px;transition:background 0.15s;">
        <span style="color:#388BFD;margin-right:7px;">${['A', 'B', 'C'][i]})</span>${o}
      </button>`).join('')}
      <div style="font-size:clamp(8px,1vw,10px);color:#8B949E;margin-top:8px;">Resposta certa desbloqueia: <span style="color:#FFDD57;">${q.itemName}</span></div>
    `;
    window._currentQuiz = q;
  }

  showEnd(win) {
    const ov = document.getElementById('hrOverlay');
    ov.style.display = 'flex';
    if (win) {
      ov.innerHTML = `<div style="text-align:center;padding:24px;">
        <div style="font-size:clamp(8px,1.2vw,11px);color:#3FB950;letter-spacing:3px;margin-bottom:6px;">MISSÃO CONCLUÍDA</div>
        <div style="font-size:clamp(22px,5vw,42px);font-weight:900;color:#00FFCC;letter-spacing:4px;text-shadow:0 0 20px #00FFCC88;margin-bottom:4px;">PC CENTRAL</div>
        <div style="font-size:clamp(8px,1.2vw,11px);color:#58A6FF;margin-bottom:14px;">DADOS: ${dataCollected}/${totalData} &nbsp;|&nbsp; ZONA 4 COMPLETADA</div>
        <div style="font-size:clamp(34px,8vw,64px);font-weight:900;color:#FFF;text-shadow:0 0 12px #00FFCC55;margin-bottom:16px;">${gameScore}<span style="font-size:0.35em;color:#8B949E;"> PTS</span></div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button onclick="window.hrStart()" style="background:linear-gradient(135deg,#3FB950,#2A8C3A);color:#000;border:none;font-family:inherit;font-size:clamp(11px,2vw,14px);font-weight:900;padding:11px 28px;border-radius:5px;cursor:pointer;letter-spacing:1px;">JOGAR NOVAMENTE</button>
          <button onclick="voltarPlataforma()" style="background:rgba(20,35,55,0.9);color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(10px,1.6vw,12px);padding:11px 22px;border-radius:5px;cursor:pointer;">MENU</button>
        </div></div>`;
    } else {
      ov.innerHTML = `<div style="text-align:center;padding:24px;">
        <div style="font-size:clamp(8px,1.2vw,11px);color:#DA3633;letter-spacing:3px;margin-bottom:6px;">SISTEMA COMPROMETIDO</div>
        <div style="font-size:clamp(22px,5vw,42px);font-weight:900;color:#FF4444;letter-spacing:4px;text-shadow:0 0 20px #FF444488;margin-bottom:4px;">GAME OVER</div>
        <div style="font-size:clamp(8px,1.2vw,11px);color:#8B949E;margin-bottom:14px;">DADOS: ${dataCollected}/${totalData} &nbsp;|&nbsp; ENERGIA ESGOTADA</div>
        <div style="font-size:clamp(34px,8vw,64px);font-weight:900;color:#FFF;margin-bottom:16px;">${gameScore}<span style="font-size:0.35em;color:#8B949E;"> PTS</span></div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button onclick="window.hrStart()" style="background:linear-gradient(135deg,#DA3633,#991A18);color:#FFF;border:none;font-family:inherit;font-size:clamp(11px,2vw,14px);font-weight:900;padding:11px 28px;border-radius:5px;cursor:pointer;letter-spacing:1px;">TENTAR NOVAMENTE</button>
          <button onclick="voltarPlataforma()" style="background:rgba(20,35,55,0.9);color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(10px,1.6vw,12px);padding:11px 22px;border-radius:5px;cursor:pointer;">MENU</button>
        </div></div>`;
    }
  }
}

class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }
  create() {
    const ov = document.getElementById('hrOverlay');
    ov.style.display = 'flex';
    ov.innerHTML = `<div style="text-align:center;padding:20px;max-width:500px;">
      <div style="font-size:clamp(8px,1.2vw,11px);color:#3FB950;letter-spacing:3px;margin-bottom:6px;">MÓDULO HARDWARE</div>
      <div style="font-size:clamp(22px,5vw,40px);font-weight:900;color:#00FFCC;letter-spacing:4px;text-shadow:0 0 18px #00FFCC66;margin-bottom:4px;">HACKER RUNNER</div>
      <div style="font-size:clamp(8px,1.2vw,11px);color:#58A6FF;letter-spacing:2px;margin-bottom:20px;">5 ZONAS  |  INFILTRE A REDE  |  PC CENTRAL</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-width:300px;margin:0 auto 20px;font-size:clamp(8px,1.2vw,10px);color:#8B949E;">
        <div style="background:#0D1520;border:1px solid #21262D;border-radius:4px;padding:6px;">[←→] MOVER</div>
        <div style="background:#0D1520;border:1px solid #21262D;border-radius:4px;padding:6px;">[SPACE/↑] PULAR</div>
        <div style="background:#0D1520;border:1px solid #21262D;border-radius:4px;padding:6px;">[WASD] alternativo</div>
        <div style="background:#0D1520;border:1px solid #21262D;border-radius:4px;padding:6px;">[↑ em vírus] DESTRUIR</div>
      </div>
      <div style="font-size:clamp(8px,1.2vw,10px);color:#FFDD57;margin-bottom:18px;letter-spacing:1px;">Colete dados → responda questões → ganhe poderes!</div>
      <button onclick="window.hrStart()" style="background:linear-gradient(135deg,#00FFCC,#00AA88);color:#000;border:none;font-family:inherit;font-size:clamp(12px,2.5vw,16px);font-weight:900;padding:12px 40px;border-radius:5px;cursor:pointer;letter-spacing:2px;">INICIAR MISSÃO</button>
      <br>
      <button onclick="voltarPlataforma()" style="margin-top:10px;background:transparent;color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(9px,1.5vw,11px);padding:8px 22px;border-radius:4px;cursor:pointer;">VOLTAR</button>
    </div>`;
  }
}

// ── Phaser Config ─────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  parent: 'gameContainer',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#020810',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [StartScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.hrStart = function () {
  document.getElementById('hrOverlay').style.display = 'none';
  document.getElementById('hrQuestion').style.display = 'none';
  if (!phaserGame) {
    phaserGame = new Phaser.Game(config);
  } else {
    phaserGame.scene.stop('StartScene');
    phaserGame.scene.stop('GameScene');
    phaserGame.scene.start('GameScene');
  }
};

window.hrAnswerQuiz = function (idx) {
  const q = window._currentQuiz;
  if (!q) return;
  window._currentQuiz = null;
  const correct = idx === q.c;
  if (correct) {
    gameItems[q.item] = true;
    gameScore += 50;
    if (gameScene) gameScene.flash('CORRETO! +50 PTS — ' + q.itemName, '#00FFCC');
  } else {
    if (gameScene) gameScene.flash('INCORRETO — ' + q.opts[q.c], '#FF4444');
  }
  document.getElementById('hrQuestion').style.display = 'none';
  if (gameScene) gameScene.quizPaused = false;
};

document.addEventListener('DOMContentLoaded', () => {
  phaserGame = new Phaser.Game(config);
});
