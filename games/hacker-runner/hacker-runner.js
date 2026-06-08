'use strict';
/* ═══════════════════════════════════════════════════════════════
   HACKER RUNNER — Phaser 3
   BootScene → StartScene → GameScene → EndScene
   Canvas 1280×720, zoom=1, câmera manual X, Y travado
═══════════════════════════════════════════════════════════════ */

function voltarPlataforma() { window.location.href = '../../index.html'; }
function lerAlunoId()   { return new URLSearchParams(window.location.search).get('alunoId')  || ''; }
function lerModuloId()  { return new URLSearchParams(window.location.search).get('moduloId') || 'hardware'; }
function salvarResultadoJogo(score, detalhes) {
  localStorage.setItem('lusca_pending_game_result', JSON.stringify({
    alunoId: lerAlunoId(), moduloId: lerModuloId(),
    gameId: 'hacker-runner', status: 'completed', score,
    details: detalhes || {}, timestamp: new Date().toISOString(),
  }));
}

const GW = 1280, GH = 720, GY = 676, PH = 26, WW = 11200;
const GRAVITY = 800, JUMP_VY = -540, JUMP2_VY = -460, SPD_N = 230, SPD_B = 350;

const C = {
  sky0:0x020810, sky1:0x071222, neon:0x00FFCC, cyan:0x00D4AA, blue:0x3B8EFF,
  yellow:0xFFDD57, red:0xE33B3B, orange:0xFF5500, purple:0x7B2FBE,
  green:0x3EBB5A, white:0xFFFFFF, dark:0x060E1C, mid:0x0C1A2E, edge:0x1A4A88,
};

const QUIZ = [
  { q:'O que define HARDWARE?', opts:['Programas instalados no PC','Parte física que podemos tocar','A conexão com a internet'], c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'CPU significa:', opts:['Central Processing Unit','Computer Power Unit','Control Program Utility'], c:0, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'Qual componente guarda dados temporariamente enquanto o PC funciona?', opts:['HD (disco rígido)','Placa de vídeo','Memória RAM'], c:2, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Teclado é um hardware de:', opts:['Saída (mostra resultado)','Entrada (manda dados ao PC)','Processamento'], c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'Monitor é um hardware de:', opts:['Entrada','Processamento','Saída (exibe resultado)'], c:2, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'SSD e HD são dispositivos de:', opts:['Processamento','Armazenamento permanente','Entrada de dados'], c:1, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Placa-mãe serve para:', opts:['Exibir imagens na tela','Conectar todos os componentes','Guardar arquivos'], c:1, item:'double_jump', itemName:'SALTO DUPLO' },
  { q:'O que é um periférico?', opts:['Hardware extra conectado ao PC','Tipo de vírus','Programa de segurança'], c:0, item:'speed', itemName:'SUPER VELOCIDADE' },
  { q:'GPU é responsável por:', opts:['Alimentação elétrica','Processamento gráfico','Armazenar dados'], c:1, item:'shield', itemName:'ESCUDO ANTI-VÍRUS' },
  { q:'Fonte de alimentação serve para:', opts:['Guardar arquivos','Converter energia elétrica para o PC','Conectar ao Wi-Fi'], c:1, item:'double_jump', itemName:'SALTO DUPLO' },
];

/* ── buildLevel ──────────────────────────────────────────────── */
function buildLevel() {
  const platforms=[], enemies=[], dataItems=[], firewalls=[], terminals=[], checkpts=[];

  const g  = (x,w)          => platforms.push({x,y:GY,w,h:PH,type:'g'});
  const p  = (x,y,w)        => platforms.push({x,y,w,h:PH,type:'p'});
  const d  = (x,y)          => dataItems.push({x, y: y??GY-44});
  // period=0 → sempre ativo; period>0 → cicla ms (onTime=ms ativo)
  const fw = (x,period,onTime) => firewalls.push({x, period:period||0, onTime:onTime||0});
  const t  = (x,qi)         => terminals.push({x, y:GY-64, quizIdx:qi});
  const patrol  = (x,range,fast)  => enemies.push({x, y:GY-19, range, fast:!!fast, type:'patrol'});
  const chaser  = (x,range)       => enemies.push({x, y:GY-19, range, fast:false,  type:'chaser'});
  const shooter = (x,platY)       => enemies.push({x, y:(platY??GY)-19, range:0, fast:false, type:'shooter'});

  // ── ZONA 0 — Tutorial (sem perigo real, ensina pulo e coleta) ─
  g(0,2200);
  p(300,GY-120,160); p(530,GY-160,180); p(780,GY-120,160);
  p(1040,GY-170,200); p(1340,GY-130,160); p(1620,GY-110,180);

  d(100); d(220); d(300,GY-120); d(550,GY-160); d(800,GY-120);
  d(1060,GY-170); d(1360,GY-130); d(1640,GY-110); d(1820); d(1980);

  patrol(1560,110,false);
  t(820,0); checkpts.push({x:2100});

  // ── ZONA 1 — Rede Inicial (patrulheiros + primeiro chaser) ───
  g(2200,500); g(2900,480); g(3580,440); g(4220,400);
  p(2710,GY-140,200); p(3400,GY-150,180); p(4040,GY-140,180);
  p(2300,GY-170,140); p(2480,GY-130,140);
  p(3000,GY-160,150); p(3170,GY-210,130);
  p(3660,GY-150,150); p(3820,GY-200,130);
  p(4300,GY-170,150); p(4470,GY-210,120);

  fw(2390); fw(2510); fw(3080); fw(3200); fw(3750); fw(3890);

  d(2250); d(2340); d(2740); d(2850); d(3020); d(3110);
  d(3690); d(3770); d(4060); d(4170); d(4340); d(4440);
  d(2300,GY-170); d(3170,GY-210); d(3820,GY-200); d(4470,GY-210);

  patrol(2380,140,false); patrol(3040,120,false); patrol(3680,100,true);
  chaser(4340,150);
  t(2890,1); t(3740,2); checkpts.push({x:4560});

  // ── ZONA 2 — Servidores (chasers + primeiro shooter) ─────────
  g(4640,400); g(5250,380); g(5840,360); g(6440,380);
  p(5040,GY-160,220); p(5640,GY-170,220); p(6240,GY-160,220);
  p(4720,GY-190,140); p(4870,GY-150,130);
  p(5350,GY-210,120); p(5490,GY-170,130);
  p(5950,GY-200,140); p(6100,GY-240,120);
  p(6550,GY-180,140); p(6680,GY-220,120);

  fw(4700); fw(4820); fw(4960); fw(5180); fw(5310); fw(5460);
  fw(5880,4000,2200); fw(6020,4000,2200); fw(6160,4000,2200);
  fw(6480,3500,1800); fw(6580,3500,1800); fw(6700,3500,1800);

  d(4680); d(4780); d(4890); d(4990); d(5060); d(5190);
  d(5300); d(5390); d(5680); d(5800); d(5910); d(6060);
  d(6150); d(6270); d(6470); d(6550);
  d(4720,GY-190); d(5350,GY-210); d(5950,GY-200); d(6100,GY-240); d(6680,GY-220);

  patrol(4720,130,false); chaser(5120,110);
  shooter(5060,GY-160);
  patrol(5800,120,true); chaser(6500,110);
  shooter(6250,GY-160);
  t(5250,3); t(6220,4); checkpts.push({x:6740});

  // ── ZONA 3 — Firewall Zone (firewalls temporizados) ──────────
  g(6780,360); g(7380,360); g(8000,340); g(8580,480);
  p(7190,GY-180,220); p(7800,GY-190,220); p(8380,GY-170,200);
  p(6870,GY-210,130); p(7000,GY-250,120);
  p(7500,GY-220,130); p(7640,GY-260,120);
  p(8100,GY-210,130); p(8250,GY-250,120);
  p(8690,GY-190,140); p(8840,GY-230,120);

  fw(6810,3000,1400); fw(6880,3000,1400); fw(6950,3000,1400);
  fw(7100,2800,1300); fw(7170,2800,1300); fw(7240,2800,1300);
  fw(7450,2500,1100); fw(7520,2500,1100); fw(7590,2500,1100);
  fw(8050,3200,1500); fw(8120,3200,1500); fw(8190,3200,1500);
  fw(8430,2800,1200); fw(8500,2800,1200); fw(8570,2800,1200);
  fw(8640,2500,1000); fw(8710,2500,1000); fw(8780,2500,1000); fw(8850,2500,1000);

  d(6800); d(6870); d(6940); d(7210); d(7310); d(7440); d(7560);
  d(7830); d(7930); d(8060); d(8290); d(8430); d(8530);
  d(8630); d(8750); d(8850);
  d(7000,GY-250); d(7640,GY-260); d(8250,GY-250); d(8840,GY-230);

  patrol(6820,110,true); chaser(7090,100); shooter(7200,GY-180);
  patrol(7450,90,true); patrol(7950,80,true);
  chaser(8420,100); shooter(8110,GY-210); patrol(8630,100,true);
  t(7370,5); t(8590,6); checkpts.push({x:8920});

  // ── ZONA 4 — PC Central (gauntlet + terminal final) ──────────
  g(8980,340); g(9600,340); g(10190,340); g(10680,300);
  p(9320,GY-190,240); p(9930,GY-200,240); p(10540,GY-180,160);
  p(9050,GY-220,130); p(9190,GY-260,120);
  p(9650,GY-230,130); p(9790,GY-270,120);
  p(10250,GY-220,130); p(10390,GY-260,120);
  p(10750,GY-200,140);

  fw(8990,2600,1200); fw(9070,2600,1200); fw(9150,2600,1200); fw(9230,2600,1200);
  fw(9380,2400,1000); fw(9460,2400,1000); fw(9540,2400,1000); fw(9620,2400,1000);
  fw(9980,2800,1200); fw(10060,2800,1200); fw(10140,2800,1200); fw(10220,2800,1200);
  fw(10450,2500,1000); fw(10530,2500,1000); fw(10610,2500,1000); fw(10690,2500,1000);

  d(9000); d(9080); d(9180); d(9350); d(9450); d(9550); d(9650); d(9750);
  d(9990); d(10070); d(10170); d(10270); d(10480); d(10580); d(10680); d(10760);
  d(9190,GY-260); d(9790,GY-270); d(10390,GY-260);

  patrol(9050,80,true); chaser(9250,70); shooter(9340,GY-190);
  patrol(9650,90,true); chaser(9850,70); shooter(9940,GY-200);
  patrol(10250,80,true); chaser(10450,90); shooter(10550,GY-220);
  t(9590,7); t(10170,8); checkpts.push({x:10640});

  return {
    platforms, enemies, dataItems, firewalls, terminals, checkpts,
    playerStart:{x:80,y:GY-80}, goalX:10750, goalY:GY-160,
    totalData: dataItems.length,
  };
}

/* ═══════════════════════════════════════════════════════════════ */
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() { this.scene.start('StartScene'); }
}

/* ═══════════════════════════════════════════════════════════════ */
class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  create() {
    const cx=GW/2, cy=GH/2;
    const bg=this.add.graphics();
    bg.fillGradientStyle(C.sky0,C.sky0,C.sky1,C.sky1,1);
    bg.fillRect(0,0,GW,GH);
    this._drawStars(bg);
    this._drawCityBg(bg);
    bg.fillStyle(C.mid,1); bg.fillRect(0,GY+PH,GW,GH-(GY+PH));
    bg.fillStyle(C.neon,0.3); bg.fillRect(0,GY,GW,2);

    const panel=this.add.graphics();
    panel.fillStyle(0x000000,0.75); panel.fillRoundedRect(cx-370,cy-270,740,540,16);
    panel.lineStyle(2,C.neon,0.6); panel.strokeRoundedRect(cx-370,cy-270,740,540,16);

    this.add.text(cx,cy-228,'MÓDULO HARDWARE',{fontFamily:'monospace',fontSize:'13px',color:'#3EBB5A',letterSpacing:5}).setOrigin(0.5);
    const title=this.add.text(cx,cy-170,'HACKER RUNNER',{fontFamily:'monospace',fontSize:'62px',fontStyle:'bold',color:'#00FFCC',stroke:'#001A11',strokeThickness:6}).setOrigin(0.5);
    this.tweens.add({targets:title,alpha:{from:1,to:0.8},duration:1600,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.add.text(cx,cy-98,'5 ZONAS · INFILTRE A REDE · RESTAURE O PC CENTRAL',{fontFamily:'monospace',fontSize:'12px',color:'#3B8EFF',letterSpacing:2}).setOrigin(0.5);

    const ctrlData=[['← →  /  A D','MOVER'],['ESPAÇO / ↑ / W','PULAR'],['E  perto do PC Central','RESTAURAR SISTEMA']];
    ctrlData.forEach(([key,act],i)=>{
      const row=cy-38+i*36;
      this.add.text(cx-210,row,key,{fontFamily:'monospace',fontSize:'12px',color:'#FFDD57'}).setOrigin(0,0.5);
      this.add.text(cx-20,row,'—',{fontFamily:'monospace',fontSize:'12px',color:'#444D56'}).setOrigin(0,0.5);
      this.add.text(cx+10,row,act,{fontFamily:'monospace',fontSize:'12px',color:'#C9D1D9'}).setOrigin(0,0.5);
    });

    this.add.text(cx,cy+78,'Terminais no caminho oferecem power-ups — são OPCIONAIS',{fontFamily:'monospace',fontSize:'11px',color:'#8B949E'}).setOrigin(0.5);
    this.add.text(cx,cy+96,'Colete pelo menos 50% dos dados para acessar o PC Central',{fontFamily:'monospace',fontSize:'11px',color:'#FFDD57'}).setOrigin(0.5);

    this._btn(cx,cy+155,'INICIAR MISSÃO',C.neon,0x003B22,()=>this.scene.start('GameScene'));
    const vol=this.add.text(cx,cy+215,'← VOLTAR À PLATAFORMA',{fontFamily:'monospace',fontSize:'12px',color:'#555D68'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    vol.on('pointerover',()=>vol.setColor('#C9D1D9')); vol.on('pointerout',()=>vol.setColor('#555D68'));
    vol.on('pointerdown',()=>voltarPlataforma());
  }

  _drawStars(g) {
    const rng=new Phaser.Math.RandomDataGenerator(['stars42']);
    for(let i=0;i<140;i++){
      g.fillStyle(rng.pick([0xFFFFFF,0xAADDFF,0x88CCFF]),rng.realInRange(0.3,0.9));
      g.fillRect(rng.integerInRange(0,GW),rng.integerInRange(0,GH*0.72),1,1);
    }
  }

  _drawCityBg(g) {
    const rng=new Phaser.Math.RandomDataGenerator(['city']);
    let bx=30;
    while(bx<GW+100){
      const bw=rng.integerInRange(18,60), bh=rng.integerInRange(50,180);
      const by=GY-bh;
      g.fillStyle(0x060D1C,0.9); g.fillRect(bx,by,bw,bh);
      for(let wy=by+6;wy<by+bh-6;wy+=10)
        for(let wx=bx+3;wx<bx+bw-3;wx+=6)
          if(rng.frac()<0.45){g.fillStyle(rng.pick([0xFFDD88,0x88AAFF,0x44CCAA]),0.5+rng.frac()*0.4);g.fillRect(wx,wy,3,5);}
      bx+=bw+rng.integerInRange(6,22);
    }
  }

  _btn(x,y,label,textCol,bgCol,cb) {
    const w=260,h=46;
    const r=this.add.rectangle(x,y,w,h,bgCol,1).setStrokeStyle(2,textCol).setInteractive({useHandCursor:true});
    const t=this.add.text(x,y,label,{fontFamily:'monospace',fontSize:'16px',fontStyle:'bold',color:'#'+textCol.toString(16).padStart(6,'0')}).setOrigin(0.5);
    r.on('pointerover',()=>r.setFillStyle(textCol,0.2)); r.on('pointerout',()=>r.setFillStyle(bgCol,1));
    r.on('pointerdown',cb); t.setInteractive({useHandCursor:true});
    t.on('pointerover',()=>r.setFillStyle(textCol,0.2)); t.on('pointerout',()=>r.setFillStyle(bgCol,1));
    t.on('pointerdown',cb);
  }
}

/* ═══════════════════════════════════════════════════════════════
   GameScene
═══════════════════════════════════════════════════════════════ */
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.score=0; this.energy=5; this.invincible=0;
    this.extraJumps=0; this.wasGround=false; this.coyoteTime=0;
    this.gameOver=false; this.won=false; this.quizOpen=false;
    this.items={double_jump:false,speed:false,shield:false};
    this.flashTimer=0; this.flashTxt=''; this.flashCol='#00FFCC';
    this.lastCpX=80; this.lastCpY=GY-80;
    this.zoneShown=-1; this.dataCount=0; this.deaths=0;
    this.startTime=Date.now(); this.usedTerminals=new Set();
    this._prevMobJump=false;
    // Restore / victory
    this._restoring=false; this._restoreMs=0;
    this._RESTORE_TOTAL=3000;

    const LVL=buildLevel();
    this.LVL=LVL;
    this.requiredData=Math.ceil(LVL.totalData*0.5);

    this.physics.world.setBounds(0,0,WW,GH+400);
    this.physics.world.gravity.y=GRAVITY;
    this.cameras.main.setBounds(0,0,WW,GH);
    this._camTargetX=80;

    this._buildBackground();
    this._createTextures();
    this._buildTilemap(LVL);
    this._buildCollectibles(LVL);
    this._buildEnemies(LVL);
    this._buildPlayer(LVL);
    this._buildGoal(LVL);

    this.physics.add.collider(this.player,this.platforms,null,this._platProcess,this);

    this.cursors=this.input.keyboard.createCursorKeys();
    this.wasd=this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.keyE=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.mobileL=false; this.mobileR=false; this.mobileJ=false;
    this._setupMobile();

    this._buildHUD();
    this._buildQuizUI();

    this.zoneToast=this.add.text(GW/2,GH/2-50,'',{fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',color:'#00FFCC',stroke:'#001A11',strokeThickness:4}).setScrollFactor(0).setDepth(30).setOrigin(0.5).setAlpha(0);
    this._showZoneToast(0);
  }

  _platProcess(player,plat) {
    if(plat.getData('type')!=='p') return true;
    return player.body.velocity.y>=0 &&
      Math.round(player.body.bottom-player.body.velocity.y*(1/60))<=plat.body.top+14;
  }

  /* ── Texturas ────────────────────────────────────────────────── */
  _createTextures() {
    const tex=(key,w,h,fn)=>{
      if(this.textures.exists(key)) return;
      const g=this.add.graphics(); fn(g); g.generateTexture(key,w,h); g.destroy();
    };

    tex('tex_ground',64,PH,g=>{
      g.fillStyle(0x061220,1); g.fillRect(0,0,64,PH);
      g.fillStyle(0x0C2040,1); g.fillRect(0,2,64,PH-2);
      g.fillStyle(C.neon,0.9); g.fillRect(0,0,64,2);
      g.fillStyle(C.neon,0.3); g.fillRect(0,2,64,1);
      g.fillStyle(0x1A4060,0.9);
      g.fillRect(6,6,52,1); g.fillRect(6,12,52,1);
      g.fillRect(6,6,1,7); g.fillRect(30,6,1,7); g.fillRect(58,6,1,7);
      g.fillStyle(C.neon,0.8); g.fillRect(10,4,3,3);
      g.fillStyle(0x3B8EFF,0.8); g.fillRect(35,4,3,3);
      g.fillStyle(0x3EBB5A,0.8); g.fillRect(57,4,3,3);
    });

    tex('tex_plat',64,PH,g=>{
      g.fillStyle(0x0D1E34,1); g.fillRect(0,0,64,PH);
      g.fillStyle(0x142840,1); g.fillRect(1,2,62,PH-2);
      g.fillStyle(C.blue,1); g.fillRect(0,0,64,2);
      g.fillStyle(C.neon,0.5); g.fillRect(2,0,60,1);
      g.fillStyle(0x0A1628,0.8); g.fillRect(4,5,56,2); g.fillRect(4,10,56,2);
      g.fillStyle(0x3EBB5A,1); g.fillRect(2,5,4,4);
      g.fillStyle(C.blue,0.9); g.fillRect(56,5,4,4);
    });

    // Firewall (26×80)
    tex('tex_fw',26,80,g=>{
      g.fillStyle(0xFF2200,0.25); g.fillRect(0,0,26,80);
      g.fillStyle(0x990A00,1); g.fillRect(3,0,20,80);
      g.fillStyle(0xBB1100,1); g.fillRect(4,0,18,80);
      for(let y=0;y<80;y+=10){ g.fillStyle(y%20===0?0xFFAA00:0x550000,0.55); g.fillRect(4,y,18,5); }
      g.fillStyle(0xFF3300,1); g.fillRect(3,0,3,80); g.fillRect(20,0,3,80);
      g.fillStyle(0xFF6600,0.3); g.fillRect(12,0,2,80);
      g.fillStyle(0xFFDD00,1);
      g.fillRect(12,20,2,2); g.fillRect(10,22,6,2); g.fillRect(8,24,10,2);
      g.fillRect(7,26,12,2); g.fillRect(7,28,12,3);
      g.fillStyle(0x990A00,1); g.fillRect(9,28,3,2); g.fillRect(14,28,3,2);
      g.fillStyle(0xFF4400,1); g.fillRect(4,52,18,2);
      g.fillStyle(0xFFCC00,1);
      g.fillRect(6,56,6,2); g.fillRect(6,58,2,6); g.fillRect(6,61,5,2);
      g.fillRect(14,56,2,8); g.fillRect(16,56,2,2); g.fillRect(16,60,2,2); g.fillRect(18,56,2,4);
      g.fillStyle(0xFF0000,1); g.fillRect(11,2,4,4);
      g.fillStyle(0xFFAAAA,0.8); g.fillRect(12,3,2,2);
    });

    // Data collectible (24×24)
    tex('tex_data',24,24,g=>{
      g.fillStyle(C.neon,0.2); g.fillRect(0,0,24,24);
      g.fillStyle(0x00BBAA,1);
      g.fillRect(10,1,4,2); g.fillRect(8,3,8,2); g.fillRect(6,5,12,2);
      g.fillRect(4,7,16,3); g.fillRect(3,10,18,4);
      g.fillRect(4,14,16,3); g.fillRect(6,17,12,2);
      g.fillRect(8,19,8,2); g.fillRect(10,21,4,2);
      g.fillStyle(C.neon,0.9);
      g.fillRect(9,4,6,2); g.fillRect(7,6,10,2); g.fillRect(6,8,12,3);
      g.fillRect(6,11,12,2); g.fillRect(7,13,10,2); g.fillRect(9,15,6,2);
      g.fillStyle(0xCCFFFF,0.9); g.fillRect(9,7,5,4);
      g.fillStyle(0xFFFFFF,1); g.fillRect(10,8,2,2);
    });

    // Projétil (14×7)
    tex('tex_proj',14,7,g=>{
      g.fillStyle(0xFF5500,1); g.fillRect(0,1,14,5);
      g.fillStyle(0xFFAA44,1); g.fillRect(0,2,14,3);
      g.fillStyle(0xFFFFFF,0.8); g.fillRect(0,2,5,2);
      g.fillStyle(0xFF8800,0.6); g.fillRect(10,1,4,5);
    });

    tex('tex_terminal',38,64,g=>{
      g.fillStyle(0x091625,1); g.fillRect(0,10,38,54);
      g.fillStyle(0x101E30,1); g.fillRect(1,11,36,52);
      g.fillStyle(C.edge,0.5); g.fillRect(0,10,38,2);
      g.fillStyle(0x00AA77,1); g.fillRect(4,15,30,26);
      g.fillStyle(0x000000,0.25);
      for(let y=15;y<41;y+=3) g.fillRect(4,y,30,1);
      g.fillStyle(0xFFFFFF,0.9); g.fillRect(6,18,5,3); g.fillRect(6,24,18,2);
      g.fillStyle(0x00FF88,1); g.fillRect(6,30,10,2);
      g.fillStyle(C.green,1); g.fillRect(32,15,4,4);
      g.fillStyle(0x060F1C,1); g.fillRect(2,47,34,14);
      for(let kx=4;kx<32;kx+=6){g.fillStyle(0x1A3050,1);g.fillRect(kx,49,4,4);}
      for(let kx=4;kx<32;kx+=6){g.fillStyle(0x1A3050,1);g.fillRect(kx,55,4,4);}
      g.fillStyle(0x00FF88,1); g.fillRect(6,38,2,5);
    });

    tex('tex_cp_off',28,44,g=>{
      g.fillStyle(0x444D56,1); g.fillRect(8,0,4,44);
      g.fillStyle(0x586069,1); g.fillRect(12,0,16,14);
      g.fillStyle(0x30363D,1); g.fillRect(13,1,14,12);
    });
    tex('tex_cp_on',28,44,g=>{
      g.fillStyle(C.green,1); g.fillRect(8,0,4,44);
      g.fillStyle(0x56D364,1); g.fillRect(12,0,16,14);
      g.fillStyle(0xCEFFC9,1); g.fillRect(13,1,14,12);
      g.fillStyle(C.green,0.2); g.fillRect(0,0,28,44);
    });

    // Jogador (40×62)
    tex('tex_player',40,62,g=>{
      g.fillStyle(0x111E30,1); g.fillRect(8,42,10,17); g.fillRect(22,42,10,17);
      g.fillStyle(C.neon,1); g.fillRect(22,57,12,4);
      g.fillStyle(0x007755,1); g.fillRect(6,57,11,4);
      g.fillStyle(0x1A2E48,1); g.fillRect(8,47,10,4); g.fillRect(22,47,10,4);
      g.fillStyle(0x101C2E,1); g.fillRect(5,22,30,22);
      g.fillStyle(0x172438,1); g.fillRect(6,23,28,20);
      g.fillStyle(C.neon,0.9); g.fillRect(5,23,2,18); g.fillRect(33,23,2,18);
      g.fillStyle(C.neon,0.7); g.fillRect(18,29,4,2); g.fillRect(16,31,8,2); g.fillRect(18,33,4,2);
      g.fillStyle(C.neon,0.5); g.fillRect(5,41,30,2);
      g.fillStyle(0x101C2E,1); g.fillRect(0,23,5,14);
      g.fillStyle(C.neon,0.6); g.fillRect(0,23,2,14);
      g.fillStyle(0x07101C,1); g.fillRect(1,20,5,18);
      g.fillStyle(C.blue,0.9); g.fillRect(1,21,5,5);
      g.fillStyle(C.neon,0.5); g.fillRect(1,29,5,3); g.fillRect(1,34,5,2);
      g.fillStyle(0x0C1828,1); g.fillRect(4,4,32,20);
      g.fillStyle(0x152030,1); g.fillRect(5,5,30,18);
      g.fillStyle(C.neon,0.35); g.fillRect(4,4,32,1);
      g.fillStyle(0x003B77,1); g.fillRect(6,9,28,11);
      g.fillStyle(0x0055AA,1); g.fillRect(6,9,28,5);
      g.fillStyle(0x0088DD,1); g.fillRect(6,9,28,3);
      g.fillStyle(0xFFFFFF,0.55); g.fillRect(7,10,9,3);
      g.fillStyle(0xFFFFFF,0.25); g.fillRect(18,10,5,2);
      g.fillStyle(C.neon,0.22); g.fillRect(5,8,30,13);
      g.fillStyle(C.neon,0.8); g.fillRect(6,9,28,1); g.fillRect(6,19,28,1);
      g.fillStyle(0x000000,0.2); g.fillRect(6,12,28,1); g.fillRect(6,15,28,1);
    });

    // Inimigo lento (36×38)
    tex('tex_enemy_slow',36,38,g=>{
      g.fillStyle(0x4400AA,0.18); g.fillRect(0,2,36,34);
      g.fillStyle(0x3D0E88,1); g.fillRect(5,10,26,18); g.fillRect(8,6,20,26);
      g.fillStyle(0x6820C0,1); g.fillRect(6,11,24,16); g.fillRect(9,7,18,24);
      g.fillStyle(0x8030D8,1); g.fillRect(10,12,16,12);
      g.fillStyle(0xAA44EE,1);
      g.fillRect(0,12,5,4); g.fillRect(0,18,5,4);
      g.fillRect(31,12,5,4); g.fillRect(31,18,5,4);
      g.fillRect(10,0,5,6); g.fillRect(17,0,4,5); g.fillRect(22,0,5,6);
      g.fillRect(10,32,4,6); g.fillRect(22,32,4,6);
      g.fillStyle(0xFF1111,1); g.fillRect(9,13,8,8); g.fillRect(19,13,8,8);
      g.fillStyle(0xFF6666,1); g.fillRect(10,14,4,4); g.fillRect(20,14,4,4);
      g.fillStyle(0xFFEEEE,1); g.fillRect(10,14,2,2); g.fillRect(20,14,2,2);
      g.fillStyle(0x220055,1); g.fillRect(9,12,8,2); g.fillRect(19,12,8,2);
      g.fillStyle(0xFF1111,0.8); g.fillRect(11,23,14,3);
      g.fillStyle(0xFFFFFF,1); g.fillRect(12,23,2,3); g.fillRect(16,23,2,3); g.fillRect(20,23,2,3);
    });

    // Inimigo rápido (36×38)
    tex('tex_enemy_fast',36,38,g=>{
      g.fillStyle(0x660020,0.18); g.fillRect(0,2,36,34);
      g.fillStyle(0x880030,1); g.fillRect(5,10,26,18); g.fillRect(8,6,20,26);
      g.fillStyle(0xCC1155,1); g.fillRect(6,11,24,16); g.fillRect(9,7,18,24);
      g.fillStyle(0xEE2277,1); g.fillRect(10,12,16,12);
      g.fillStyle(0xFF3399,1);
      g.fillRect(0,10,5,4); g.fillRect(0,16,5,4); g.fillRect(0,22,5,4);
      g.fillRect(31,10,5,4); g.fillRect(31,16,5,4); g.fillRect(31,22,5,4);
      g.fillRect(9,0,4,7); g.fillRect(15,0,3,6); g.fillRect(21,0,4,7);
      g.fillRect(10,31,3,7); g.fillRect(23,31,3,7);
      g.fillStyle(0xFF5500,1); g.fillRect(9,13,8,8); g.fillRect(19,13,8,8);
      g.fillStyle(0xFF9922,1); g.fillRect(10,14,4,4); g.fillRect(20,14,4,4);
      g.fillStyle(0xFFFFCC,1); g.fillRect(10,14,2,2); g.fillRect(20,14,2,2);
      g.fillStyle(0x330000,1); g.fillRect(9,12,8,2); g.fillRect(19,12,8,2);
      g.fillStyle(0xFF3300,0.9); g.fillRect(11,23,14,3);
      g.fillStyle(0xFFFFFF,1);
      g.fillRect(11,23,2,3); g.fillRect(14,23,2,3); g.fillRect(17,23,2,3); g.fillRect(20,23,2,3); g.fillRect(23,23,2,3);
    });
  }

  /* ── Fundo em camadas parallax (MANTIDO INTACTO) ────────────── */
  _buildBackground() {
    const sky=this.add.graphics().setScrollFactor(0).setDepth(-20);
    sky.fillGradientStyle(0x010408,0x010408,0x071830,0x071830,1);
    sky.fillRect(0,0,GW,GH);
    this._drawBgStars(sky);
    sky.fillStyle(0xAADDFF,0.12); sky.fillCircle(GW*0.82,80,48);
    sky.fillStyle(0xCCEEFF,0.07); sky.fillCircle(GW*0.82,80,62);
    sky.fillStyle(0xEEF8FF,0.28); sky.fillCircle(GW*0.82,80,28);
    sky.fillStyle(0x0033AA,0.07); sky.fillEllipse(GW*0.3,200,500,250);
    sky.fillStyle(0x440088,0.05); sky.fillEllipse(GW*0.7,160,400,200);

    const far=this.add.graphics().setScrollFactor(0.05).setDepth(-19);
    this._drawSkyscrapers(far,'far',0x020608,0.95,0.18,240,560);

    const mid1=this.add.graphics().setScrollFactor(0.15).setDepth(-18);
    this._drawSkyscrapers(mid1,'mid1',0x030A14,0.95,0.3,120,380);
    this._drawAntennas(mid1);

    const near=this.add.graphics().setScrollFactor(0.35).setDepth(-17);
    this._drawSkyscrapers(near,'near',0x050E1C,0.98,0.55,60,220);
    this._drawNeonSigns(near);

    const haze=this.add.graphics().setScrollFactor(0).setDepth(-16);
    haze.fillGradientStyle(0x000000,0x000000,0x0A2040,0x0A2040,0);
    haze.fillRect(0,GY-180,GW,180);
    haze.lineStyle(1,C.neon,0.06); haze.lineBetween(0,GY-2,GW,GY-2);

    const floor=this.add.graphics().setDepth(-14);
    floor.fillStyle(0x040B14,1); floor.fillRect(0,GY+PH,WW,GH-(GY+PH));
    floor.lineStyle(1,C.neon,0.1);
    for(let x=0;x<WW;x+=160) floor.lineBetween(x,GY+PH,x,GH);
    floor.lineStyle(1,C.neon,0.05);
    floor.lineBetween(0,GY+PH+20,WW,GY+PH+20);
    floor.lineBetween(0,GY+PH+44,WW,GY+PH+44);
  }

  _drawBgStars(g) {
    const rng=new Phaser.Math.RandomDataGenerator(['bg_stars_v2']);
    for(let i=0;i<200;i++){
      g.fillStyle(rng.pick([0xFFFFFF,0xBBDDFF,0x88BBFF,0xCCFFFF]),rng.realInRange(0.2,0.85));
      g.fillRect(rng.integerInRange(0,GW),rng.integerInRange(0,Math.floor(GH*0.65)),1,1);
    }
    for(let i=0;i<12;i++){
      const sx=rng.integerInRange(0,GW),sy=rng.integerInRange(0,Math.floor(GH*0.55));
      g.fillStyle(0xFFFFFF,0.95); g.fillRect(sx,sy,2,2);
      g.fillStyle(0xAADDFF,0.25); g.fillRect(sx-1,sy-1,4,4);
    }
  }

  _drawSkyscrapers(g,seed,col,bodyAlpha,winAlpha,minH,maxH) {
    const rng=new Phaser.Math.RandomDataGenerator(['sky_'+seed]);
    let bx=0;
    const worldW=WW*(seed==='far'?0.12:seed==='mid1'?0.25:0.5);
    while(bx<worldW+400){
      const bw=rng.integerInRange(30,90), bh=rng.integerInRange(minH,maxH);
      const by=GY-bh;
      g.fillStyle(col,bodyAlpha); g.fillRect(bx,by,bw,bh+PH);
      g.fillStyle(0x1155AA,0.18); g.fillRect(bx,by,1,bh); g.fillRect(bx+bw-1,by,1,bh);
      g.fillStyle(0x1155AA,0.08); g.fillRect(bx,by,bw,1);
      if(bw>50&&rng.frac()>0.4){
        const sw=rng.integerInRange(12,bw-10);
        const sx=bx+rng.integerInRange(0,bw-sw), sh=rng.integerInRange(30,80);
        g.fillStyle(col,bodyAlpha); g.fillRect(sx,by-sh,sw,sh);
        g.fillStyle(0x1155AA,0.15); g.fillRect(sx,by-sh,1,sh); g.fillRect(sx+sw-1,by-sh,1,sh);
      }
      for(let wy=by+10;wy<by+bh-8;wy+=9){
        for(let wx=bx+4;wx<bx+bw-4;wx+=7){
          if(rng.frac()<(winAlpha>0.4?0.65:0.5)){
            g.fillStyle(rng.pick([0xFFEE88,0x88AAFF,0x44DDBB,0xFF9955,0xCCBBFF]),winAlpha*rng.realInRange(0.5,1.0));
            g.fillRect(wx,wy,4,5);
          }
        }
      }
      const topCol=rng.pick([C.neon,C.blue,0x9933FF,0xFF3388]);
      g.fillStyle(topCol,0.4+rng.frac()*0.4); g.fillRect(bx,by,bw,1);
      bx+=bw+rng.integerInRange(3,18);
    }
  }

  _drawAntennas(g) {
    const rng=new Phaser.Math.RandomDataGenerator(['ant']);
    let bx=80;
    while(bx<WW*0.25){
      if(rng.frac()>0.5){
        const h=rng.integerInRange(40,110), by=GY-rng.integerInRange(120,380)-h;
        g.fillStyle(0x223344,0.8); g.fillRect(bx,by,3,h);
        g.fillStyle(0xFF2222,0.7); g.fillRect(bx,by,5,4);
        if(rng.frac()>0.5){const armL=rng.integerInRange(12,28);g.fillStyle(0x223344,0.7);g.fillRect(bx-armL,by+rng.integerInRange(8,h/2),armL,2);}
      }
      bx+=rng.integerInRange(60,200);
    }
  }

  _drawNeonSigns(g) {
    const rng=new Phaser.Math.RandomDataGenerator(['signs']);
    const colors=[C.neon,0xFF3388,0x9933FF,C.blue,0xFF6600];
    let bx=100;
    while(bx<WW*0.6){
      if(rng.frac()>0.6){
        const sy=rng.integerInRange(GY-300,GY-100);
        const sw=rng.integerInRange(20,60), sh=rng.integerInRange(6,14);
        const nc=rng.pick(colors);
        g.fillStyle(nc,rng.realInRange(0.12,0.35)); g.fillRect(bx,sy,sw,sh);
        g.lineStyle(1,nc,rng.realInRange(0.5,0.85)); g.strokeRect(bx,sy,sw,sh);
        g.fillStyle(nc,0.7);
        for(let i=3;i<sw-3;i+=5) g.fillRect(bx+i,sy+2,3,sh-4);
      }
      bx+=rng.integerInRange(80,300);
    }
  }

  /* ── Tilemap ─────────────────────────────────────────────────── */
  _buildTilemap(LVL) {
    this.platforms=this.physics.add.staticGroup();
    for(const pl of LVL.platforms){
      const key=pl.type==='g'?'tex_ground':'tex_plat';
      const spr=this.platforms.create(pl.x+pl.w/2,pl.y+pl.h/2,key);
      spr.setDisplaySize(pl.w,pl.h); spr.body.setSize(pl.w,pl.h); spr.refreshBody();
      spr.setData('type',pl.type);
    }

    this.fwGroup=this.physics.add.staticGroup();
    for(const fw of LVL.firewalls){
      const spr=this.fwGroup.create(fw.x+13,GY-40,'tex_fw');
      spr.body.setSize(20,76); spr.refreshBody();
      spr.setData('period',fw.period);
      spr.setData('onTime',fw.onTime);
      // Stagger phase so all firewalls don't blink in sync
      const initPhase=fw.period>0 ? Math.random()*fw.period : 0;
      spr.setData('phase',initPhase);
      const startActive=fw.period===0||(initPhase<fw.onTime);
      spr.setData('active',startActive);
      if(!startActive){ spr.setAlpha(0.15); spr.body.enable=false; }
    }

    this.termGroup=this.physics.add.staticGroup();
    LVL.terminals.forEach((t,i)=>{
      const spr=this.termGroup.create(t.x+19,t.y+32,'tex_terminal');
      spr.setData('quizIdx',t.quizIdx); spr.setData('idx',i);
      spr.body.setSize(38,64); spr.refreshBody();
    });

    this.cpGroup=this.physics.add.staticGroup();
    for(const cp of LVL.checkpts){
      const spr=this.cpGroup.create(cp.x+14,GY-22,'tex_cp_off');
      spr.setData('activated',false); spr.setData('ox',cp.x);
      spr.body.setSize(28,44); spr.refreshBody();
    }
  }

  _buildCollectibles(LVL) {
    this.dataGroup=this.physics.add.staticGroup();
    for(const d of LVL.dataItems){
      const spr=this.dataGroup.create(d.x,d.y,'tex_data');
      spr.setData('t',Math.random()*Math.PI*2);
      spr.body.setSize(18,18); spr.refreshBody();
    }
  }

  /* ── Inimigos ─────────────────────────────────────────────────── */
  _buildEnemies(LVL) {
    this.enemyGroup=this.physics.add.group();
    this.projGroup=this.physics.add.group();

    for(const en of LVL.enemies){
      const key=en.fast?'tex_enemy_fast':'tex_enemy_slow';
      const spr=this.enemyGroup.create(en.x,en.y,key);
      spr.body.allowGravity=false;
      spr.setData('startX',en.x);
      spr.setData('range',en.range);
      spr.setData('fast',en.fast);
      spr.setData('type',en.type);
      spr.setData('dir',-1);
      spr.setData('alive',true);
      spr.setData('fireTimer',1000+Math.random()*1000); // stagger first shot
      spr.setData('alert',false);
      if(en.type==='patrol'){
        const spd=en.fast?110:70;
        spr.body.setVelocityX(-spd);
      }
    }
  }

  _buildPlayer(LVL) {
    this.player=this.physics.add.sprite(LVL.playerStart.x,LVL.playerStart.y,'tex_player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocityY(900);
    this.player.body.setSize(28,58);
    this.player.body.setOffset(6,3);
  }

  /* ── PC Central ──────────────────────────────────────────────── */
  _buildGoal(LVL) {
    this.goalGfx=this.add.graphics().setDepth(4);
    this._drawGoalGfx(0);
    this._goalRect=new Phaser.Geom.Rectangle(LVL.goalX-40,LVL.goalY-10,140,150);

    // Restore progress UI (screen-space)
    this._restoreOverlay=this.add.graphics().setScrollFactor(0).setDepth(60).setVisible(false);
    this._restoreTxt=this.add.text(GW/2,GH/2-55,'RESTAURANDO SISTEMA...',{
      fontFamily:'monospace',fontSize:'22px',fontStyle:'bold',
      color:'#00FFCC',stroke:'#000',strokeThickness:5,
    }).setScrollFactor(0).setDepth(61).setOrigin(0.5).setVisible(false);
    this._restoreBar=this.add.graphics().setScrollFactor(0).setDepth(61).setVisible(false);

    this._goalHint=this.add.text(GW/2,GH*0.76,'',{
      fontFamily:'monospace',fontSize:'15px',fontStyle:'bold',
      color:'#00FFCC',stroke:'#000',strokeThickness:3,
    }).setScrollFactor(0).setDepth(62).setOrigin(0.5).setAlpha(0);
  }

  _drawGoalGfx(t) {
    const g=this.goalGfx, gx=this.LVL.goalX, gy=this.LVL.goalY;
    const gl=0.55+Math.sin(t*0.003)*0.35;
    g.clear();
    g.fillStyle(C.neon,gl*0.08); g.fillRect(gx-14,gy-10,88,148);
    g.lineStyle(2,C.neon,gl*0.7); g.strokeRect(gx-4,gy,68,128);
    g.lineStyle(1,C.cyan,gl*0.3); g.strokeRect(gx-2,gy+2,64,124);
    g.fillStyle(0x080E18,1); g.fillRect(gx,gy+8,60,118);
    g.fillStyle(0x0D1828,1); g.fillRect(gx+1,gy+9,58,116);
    g.fillStyle(0x007755,gl*0.9); g.fillRect(gx+5,gy+16,50,80);
    g.fillStyle(0x000000,0.15);
    for(let sy=gy+16;sy<gy+96;sy+=4) g.fillRect(gx+5,sy,50,2);
    g.fillStyle(0xDDFFEE,gl*0.9); g.fillRect(gx+9,gy+22,8,6);
    g.fillStyle(0xFFFFFF,gl*0.8); g.fillRect(gx+9,gy+32,28,3); g.fillRect(gx+9,gy+38,18,3);
    g.fillStyle(0x00FF88,gl); g.fillRect(gx+9,gy+46,12,3); g.fillRect(gx+9,gy+52,20,3);
    if(gl>0.7){g.fillStyle(0x00FF88,1);g.fillRect(gx+9,gy+60,8,5);}
    g.fillStyle(0x050B14,1); g.fillRect(gx+2,gy+100,56,22);
    g.fillStyle(C.neon,gl); g.fillRect(gx+52,gy+16,5,5);
    g.lineStyle(2,C.neon,gl*0.5);
    g.lineBetween(gx+16,gy+122,gx+16,gy+134); g.lineBetween(gx+44,gy+122,gx+44,gy+134);
    g.fillStyle(C.neon,gl*0.9); g.fillRect(gx+2,gy-14,56,11);
    g.fillStyle(0x000000,0.8); g.fillRect(gx+3,gy-13,54,9);
    g.fillStyle(C.neon,gl); g.fillRect(gx+5,gy-12,3,7);
  }

  /* ── HUD ──────────────────────────────────────────────────────── */
  _buildHUD() {
    const d=20;
    this.hudBg=this.add.graphics().setScrollFactor(0).setDepth(d);
    const stv={fontFamily:'monospace',fontSize:'12px',fontStyle:'bold',color:'#FFFFFF'};
    const sts={fontFamily:'monospace',fontSize:'10px',color:'#8B949E'};

    this.hudDataVal=this.add.text(210,7,'0/0',stv).setScrollFactor(0).setDepth(d+1).setColor('#00FFCC');
    this.hudPtsVal=this.add.text(GW-70,7,'00000',stv).setScrollFactor(0).setDepth(d+1).setColor('#FFDD57');
    this.hudZoneTxt=this.add.text(GW/2,7,'ZONA 0/4',sts).setScrollFactor(0).setDepth(d+1).setOrigin(0.5,0).setColor('#3B8EFF');
    this.hudFlash=this.add.text(GW/2,36,'',{fontFamily:'monospace',fontSize:'13px',color:'#00FFCC',stroke:'#000',strokeThickness:3}).setScrollFactor(0).setDepth(d+1).setOrigin(0.5,0).setAlpha(0);
    this.termHint=this.add.text(GW/2,GH*0.72,'[ ↑ ]  ACESSAR TERMINAL',{fontFamily:'monospace',fontSize:'14px',color:'#FFDD57',stroke:'#000',strokeThickness:3}).setScrollFactor(0).setDepth(d+1).setOrigin(0.5).setAlpha(0);
  }

  _redrawHUD() {
    const g=this.hudBg; g.clear();
    g.fillStyle(0x010509,0.92); g.fillRect(0,0,GW,30);
    g.lineStyle(1,C.neon,0.18); g.lineBetween(0,30,GW,30);

    // HP blocos
    g.lineStyle(1,C.neon,0.3); g.strokeRect(38,4,5*20+2,22);
    for(let i=0;i<5;i++){
      const on=i<this.energy;
      const col=on?(this.energy>3?C.green:this.energy>1?C.yellow:C.red):0x141F33;
      g.fillStyle(col,on?0.9:0.4); g.fillRect(39+i*20,5,18,20);
    }
    // HP label pixels
    g.fillStyle(C.neon,0.5); g.fillRect(6,10,29,11);
    g.fillStyle(0x000000,0.6); g.fillRect(7,11,27,9);
    g.fillStyle(C.neon,0.9);
    g.fillRect(9,12,2,7); g.fillRect(12,12,2,7); g.fillRect(9,15,5,2);
    g.fillRect(15,12,2,7); g.fillRect(15,12,4,2); g.fillRect(15,15,4,2); g.fillRect(19,12,2,4);

    // Items
    const items=[{key:'double_jump',label:'2JMP',col:C.neon},{key:'speed',label:'VEL+',col:C.yellow},{key:'shield',label:'ESC',col:0xFF9944}];
    items.forEach((it,i)=>{
      const ix=152+i*52,iy=4,on=this.items[it.key];
      g.fillStyle(it.col,on?0.2:0.05); g.fillRect(ix,iy,48,22);
      g.lineStyle(1,it.col,on?1:0.25); g.strokeRect(ix,iy,48,22);
    });

    // Progresso zona
    const zone=Math.min(4,Math.floor(this.player.x/(WW/5)));
    g.fillStyle(C.blue,0.15); g.fillRect(GW/2-80,4,160,22);
    g.fillStyle(C.blue,0.55); g.fillRect(GW/2-80,4,zone*40,22);
    g.lineStyle(1,C.blue,0.4); g.strokeRect(GW/2-80,4,160,22);

    // Dados / pontos
    g.fillStyle(0xFFFFFF,0.06); g.fillRect(GW-110,4,106,22);
    g.lineStyle(1,C.yellow,0.2); g.strokeRect(GW-110,4,106,22);

    // Progresso dados — barra pequena abaixo HP
    const dataFrac=Math.min(1,this.dataCount/this.requiredData);
    const barW=102, barH=4, barX=39, barY=27;
    g.fillStyle(0x00FFCC,0.15); g.fillRect(barX,barY,barW,barH);
    g.fillStyle(dataFrac>=1?0xFFDD57:C.neon,0.9); g.fillRect(barX,barY,barW*dataFrac,barH);

    this.hudDataVal.setText(`${this.dataCount}/${this.LVL.totalData}`);
    this.hudPtsVal.setText(String(this.score).padStart(5,'0'));
    this.hudZoneTxt.setText(`ZONA ${zone}/4`);

    if(this.flashTimer>0){ this.flashTimer--; this.hudFlash.setAlpha(Math.min(1,this.flashTimer/20)); }
    else { this.hudFlash.setAlpha(0); }
  }

  flash(txt,col) {
    this.hudFlash.setText(txt); this.hudFlash.setColor(col||'#00FFCC');
    this.flashTimer=100;
  }

  /* ── Quiz UI ──────────────────────────────────────────────────── */
  _buildQuizUI() {
    const d=50;
    this.quizContainer=this.add.container(GW/2,GH/2).setScrollFactor(0).setDepth(d).setVisible(false);
    const bg=this.add.graphics();
    bg.fillStyle(0x010810,0.97); bg.fillRoundedRect(-320,-175,640,350,12);
    bg.lineStyle(2,C.neon,0.85); bg.strokeRoundedRect(-320,-175,640,350,12);
    this.quizLabel=this.add.text(0,-152,'TERMINAL — QUESTÃO DE HARDWARE',{fontFamily:'monospace',fontSize:'11px',color:'#00FFCC',letterSpacing:3}).setOrigin(0.5);
    this.quizQ=this.add.text(0,-102,'',{fontFamily:'monospace',fontSize:'16px',fontStyle:'bold',color:'#E6EDF3',wordWrap:{width:580},align:'center'}).setOrigin(0.5);
    this.quizBtns=[];
    const ys=[18,72,126];
    ['A','B','C'].forEach((ltr,i)=>{
      const bg2=this.add.graphics();
      bg2.fillStyle(0x0C1A2E,1); bg2.fillRoundedRect(-295,ys[i]-19,590,38,6);
      bg2.lineStyle(1,0x21262D,1); bg2.strokeRoundedRect(-295,ys[i]-19,590,38,6);
      const lbl=this.add.text(-279,ys[i],ltr+')',{fontFamily:'monospace',fontSize:'13px',color:'#3B8EFF'}).setOrigin(0,0.5);
      const opt=this.add.text(-255,ys[i],'',{fontFamily:'monospace',fontSize:'13px',color:'#E6EDF3',wordWrap:{width:520}}).setOrigin(0,0.5);
      const zone=this.add.zone(-295,ys[i]-19,590,38).setOrigin(0,0).setInteractive({useHandCursor:true});
      zone.on('pointerover',()=>{bg2.clear();bg2.fillStyle(0x003B22,1);bg2.fillRoundedRect(-295,ys[i]-19,590,38,6);bg2.lineStyle(1,C.neon,0.8);bg2.strokeRoundedRect(-295,ys[i]-19,590,38,6);});
      zone.on('pointerout',()=>{bg2.clear();bg2.fillStyle(0x0C1A2E,1);bg2.fillRoundedRect(-295,ys[i]-19,590,38,6);bg2.lineStyle(1,0x21262D,1);bg2.strokeRoundedRect(-295,ys[i]-19,590,38,6);});
      zone.on('pointerdown',()=>this._answerQuiz(i));
      this.quizBtns.push({bg:bg2,lbl,opt,zone});
    });
    this.quizReward=this.add.text(0,158,'',{fontFamily:'monospace',fontSize:'11px',color:'#8B949E'}).setOrigin(0.5);
    this.quizContainer.add([bg,this.quizLabel,this.quizQ,this.quizReward,...this.quizBtns.flatMap(b=>[b.bg,b.lbl,b.opt,b.zone])]);
    this._activeQuiz=null;
  }

  _openQuiz(quizIdx) {
    if(this.quizOpen) return;
    const q=QUIZ[quizIdx%QUIZ.length];
    this._activeQuiz=q; this.quizOpen=true; this.physics.pause();
    this.quizQ.setText(q.q);
    q.opts.forEach((o,i)=>this.quizBtns[i].opt.setText(o));
    this.quizReward.setText('Acerte para ganhar: '+q.itemName);
    this.quizContainer.setVisible(true).setAlpha(0);
    this.tweens.add({targets:this.quizContainer,alpha:1,duration:220});
  }

  _answerQuiz(idx) {
    if(!this._activeQuiz) return;
    const q=this._activeQuiz;
    this.tweens.add({targets:this.quizContainer,alpha:0,duration:200,onComplete:()=>{
      this.quizContainer.setVisible(false); this.quizOpen=false; this.physics.resume(); this._activeQuiz=null;
      if(idx===q.c){ this.items[q.item]=true; this.score+=50; this.flash('CORRETO! +50  '+q.itemName,'#00FFCC'); this.cameras.main.flash(300,0,255,180); }
      else { this.flash('INCORRETO — '+q.opts[q.c],'#FF4444'); }
    }});
  }

  _showZoneToast(zone) {
    if(zone===this.zoneShown) return;
    this.zoneShown=zone;
    const names=['ZONA 0 — TUTORIAL','ZONA 1 — REDE INICIAL','ZONA 2 — SERVIDORES','ZONA 3 — FIREWALL ZONE','ZONA 4 — PC CENTRAL'];
    this.zoneToast.setText(names[zone]||'');
    this.tweens.killTweensOf(this.zoneToast);
    this.tweens.add({targets:this.zoneToast,alpha:{from:0,to:1},duration:350,yoyo:true,hold:1500,ease:'Sine.easeInOut'});
  }

  _setupMobile() {
    const wire=(id,prop,val)=>{
      const el=document.getElementById(id); if(!el) return;
      el.addEventListener('touchstart',e=>{e.preventDefault();this[prop]=val;},{passive:false});
      el.addEventListener('touchend',e=>{e.preventDefault();this[prop]=!val;},{passive:false});
      el.addEventListener('touchcancel',e=>{e.preventDefault();this[prop]=!val;},{passive:false});
    };
    wire('btnLeft','mobileL',true); wire('btnRight','mobileR',true);
    const bj=document.getElementById('btnJump');
    if(bj){
      bj.addEventListener('touchstart',e=>{e.preventDefault();this.mobileJ=true;},{passive:false});
      bj.addEventListener('touchend',e=>{e.preventDefault();this.mobileJ=false;},{passive:false});
      bj.addEventListener('touchcancel',e=>{e.preventDefault();this.mobileJ=false;},{passive:false});
    }
  }

  /* ── Loop ─────────────────────────────────────────────────────── */
  update(time,delta) {
    if(this.gameOver||this.won||this.quizOpen) return;

    const p=this.player, b=p.body, gnd=b.blocked.down;

    // Câmera
    const targetX=Math.max(0,Math.min(WW-GW,p.x-GW*0.38));
    this._camTargetX+=(targetX-this._camTargetX)*0.1;
    this.cameras.main.scrollX=this._camTargetX;
    this.cameras.main.scrollY=0;

    this._showZoneToast(Math.min(4,Math.floor(p.x/(WW/5))));

    // Movimento
    const spd=this.items.speed?SPD_B:SPD_N;
    const goL=this.cursors.left.isDown||this.wasd.A.isDown||this.mobileL;
    const goR=this.cursors.right.isDown||this.wasd.D.isDown||this.mobileR;
    if(goL){b.setVelocityX(-spd);p.setFlipX(true);}
    else if(goR){b.setVelocityX(spd);p.setFlipX(false);}
    else{b.setVelocityX(b.velocity.x*0.6);}

    // Salto
    const jumpNow=
      Phaser.Input.Keyboard.JustDown(this.cursors.up)||
      Phaser.Input.Keyboard.JustDown(this.wasd.W)||
      Phaser.Input.Keyboard.JustDown(this.wasd.SPACE)||
      (!this._prevMobJump&&this.mobileJ);
    if(jumpNow){
      if(gnd||this.coyoteTime>0){ b.setVelocityY(JUMP_VY); this.extraJumps=this.items.double_jump?1:0; this.coyoteTime=0; }
      else if(this.extraJumps>0){ b.setVelocityY(JUMP2_VY); this.extraJumps--; }
    }
    this._prevMobJump=this.mobileJ;
    if(!gnd&&this.wasGround) this.coyoteTime=8;
    if(this.coyoteTime>0) this.coyoteTime--;
    if(gnd) this.extraJumps=this.items.double_jump?1:0;
    this.wasGround=gnd;

    if(this.invincible>0){ this.invincible--; p.setAlpha(Math.floor(this.invincible/6)%2===0?1:0.3); }
    else { p.setAlpha(1); }

    this._tickEnemies(delta);
    this._tickProjectiles();
    this._tickData();
    this._tickFirewalls(delta);
    this._tickCheckpoints();
    this._tickTerminals();
    this._tickGoalTerminal(delta,time);

    this._drawGoalGfx(time);
    if(p.y>GH+80) this._respawn();
    this._redrawHUD();
  }

  /* ── IA dos inimigos ──────────────────────────────────────────── */
  _tickEnemies(delta) {
    const p=this.player;
    this.enemyGroup.getChildren().forEach(en=>{
      if(!en.getData('alive')) return;
      const type=en.getData('type');
      const fast=en.getData('fast');
      const sx=en.getData('startX');
      const range=en.getData('range');

      if(type==='patrol') {
        const spd=fast?110:70;
        let dir=en.getData('dir');
        if(en.x<sx-range||en.x>sx+range){ dir*=-1; en.setData('dir',dir); }
        en.body.setVelocityX(dir*spd);
        en.setFlipX(dir>0);
      }
      else if(type==='chaser') {
        const dist=Math.abs(p.x-en.x);
        if(dist<180) en.setData('alert',true);
        else if(dist>320) en.setData('alert',false);

        if(en.getData('alert')){
          const cDir=p.x>en.x?1:-1;
          en.body.setVelocityX(cDir*95);
          en.setFlipX(cDir>0);
          // Alert visual: orange tint pulse
          en.setTint(Math.floor(Date.now()/200)%2===0?0xFF8844:0xFFFFFF);
        } else {
          en.body.setVelocityX(0);
          en.clearTint();
        }
      }
      else if(type==='shooter') {
        en.body.setVelocityX(0);
        let ft=en.getData('fireTimer')-delta;
        if(ft<=0){
          ft=2200+Math.random()*600;
          const dir=p.x>en.x?1:-1;
          this._addProjectile(en.x+(dir>0?20:-20),en.y-4,dir);
        }
        en.setData('fireTimer',ft);
        // Face player
        en.setFlipX(p.x>en.x);
      }

      // Stomp / dano
      if(this.invincible>0) return;
      if(!Phaser.Geom.Rectangle.Overlaps(p.getBounds(),en.getBounds())) return;
      const stomping=p.body.velocity.y>60&&p.body.bottom<en.body.top+18;
      if(stomping){
        this._killEnemy(en);
        p.body.setVelocityY(JUMP_VY*0.6);
        this.score+=25;
        this.flash('VÍRUS DESTRUÍDO  +25','#CC88FF');
        this.cameras.main.shake(140,0.006);
      } else {
        this._damage(false);
      }
    });
  }

  _killEnemy(en) {
    en.setData('alive',false);
    this.tweens.add({targets:en,alpha:0,scaleX:2,scaleY:0.5,duration:250,
      onComplete:()=>{en.setVisible(false);en.body.enable=false;}});
  }

  _addProjectile(x,y,dir) {
    if(this.projGroup.getLength()>20) return; // safety cap
    const spr=this.projGroup.create(x,y,'tex_proj');
    spr.body.allowGravity=false;
    spr.body.setVelocityX(dir*300);
    spr.setFlipX(dir<0);
  }

  _tickProjectiles() {
    this.projGroup.getChildren().forEach(proj=>{
      if(proj.x<-100||proj.x>WW+100){proj.destroy();return;}
      if(this.invincible>0) return;
      if(Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(),proj.getBounds())){
        // Spark effect
        this.cameras.main.shake(80,0.005);
        proj.destroy();
        this._damage(false);
        this.flash('PROJÉTIL!','#FF5500');
      }
    });
  }

  _tickData() {
    this.physics.overlap(this.player,this.dataGroup,(pl,d)=>{
      d.destroy(); this.dataCount++; this.score+=10;
      this.flash('DADO +10','#00FFCC');
      this.cameras.main.flash(80,0,180,140,true);
    });
  }

  /* ── Firewalls com timing ──────────────────────────────────────── */
  _tickFirewalls(delta) {
    const pb=this.player.getBounds();
    this.fwGroup.getChildren().forEach(fw=>{
      const period=fw.getData('period');

      if(period===0){
        // Sempre ativo
        if(this.invincible===0&&Phaser.Geom.Rectangle.Overlaps(pb,fw.getBounds()))
          this._onFwHit();
        return;
      }

      // Ciclo temporizado
      let phase=(fw.getData('phase')+delta)%period;
      fw.setData('phase',phase);
      const onTime=fw.getData('onTime');
      let active=fw.getData('active');

      if(phase<onTime){
        if(!active){
          fw.setData('active',true); active=true;
          fw.setAlpha(1.0); fw.body.enable=true; fw.clearTint();
        }
      } else {
        const offRemaining=period-phase;
        if(active){
          fw.setData('active',false); active=false;
          fw.setAlpha(0.15); fw.body.enable=false;
        }
        // Pisca nos últimos 500ms do período off (aviso de reativação)
        if(offRemaining<600){
          fw.setAlpha(0.15+0.65*(1-offRemaining/600));
        }
      }

      if(active&&this.invincible===0&&Phaser.Geom.Rectangle.Overlaps(pb,fw.getBounds()))
        this._onFwHit();
    });
  }

  _onFwHit() {
    if(this.items.shield){
      this.items.shield=false;
      this.flash('ESCUDO ATIVADO!','#FFDD57');
      this.cameras.main.shake(200,0.009);
      this.invincible=40;
    } else {
      this._damage(true);
      this.flash('FIREWALL!','#FF5500');
    }
  }

  _tickCheckpoints() {
    this.physics.overlap(this.player,this.cpGroup,(pl,cp)=>{
      if(cp.getData('activated')) return;
      cp.setData('activated',true); cp.setTexture('tex_cp_on');
      this.lastCpX=cp.getData('ox'); this.lastCpY=GY-80;
      this.flash('CHECKPOINT SALVO!','#FFDD57');
      this.cameras.main.flash(220,255,200,0,false);
    });
  }

  _tickTerminals() {
    let near=false, nearIdx=-1;
    this.termGroup.getChildren().forEach(t=>{
      const ti=t.getData('idx');
      if(this.usedTerminals.has(ti)) return;
      if(!Phaser.Geom.Rectangle.Overlaps(this.player.getBounds(),t.getBounds())) return;
      near=true; nearIdx=t.getData('quizIdx');
      if(Phaser.Input.Keyboard.JustDown(this.cursors.up)||Phaser.Input.Keyboard.JustDown(this.wasd.W)){
        this.usedTerminals.add(ti);
        this._openQuiz(nearIdx);
      }
    });
    this.termHint.setAlpha(near?Math.min(1,this.termHint.alpha+0.09):Math.max(0,this.termHint.alpha-0.09));
  }

  /* ── Terminal do PC Central ───────────────────────────────────── */
  _tickGoalTerminal(delta,time) {
    if(this._restoring){
      this._restoreMs+=delta;
      const prog=Math.min(1,this._restoreMs/this._RESTORE_TOTAL);

      // Desenha barra de progresso
      const g=this._restoreBar; g.clear();
      const bw=420,bh=28,bx=GW/2-bw/2,by=GH/2-6;
      g.fillStyle(0x010810,0.96); g.fillRect(bx-8,by-8,bw+16,bh+16);
      g.lineStyle(2,C.neon,0.8); g.strokeRect(bx-8,by-8,bw+16,bh+16);
      g.fillStyle(C.neon,0.1); g.fillRect(bx,by,bw,bh);
      g.fillStyle(C.neon,1); g.fillRect(bx,by,bw*prog,bh);
      // Scanline
      for(let i=0;i<bw*prog;i+=12){g.fillStyle(0xFFFFFF,0.08);g.fillRect(bx+i,by,6,bh);}

      if(prog>=1){ this._onVictory(); }
      return;
    }

    const near=Phaser.Geom.Rectangle.Contains(this._goalRect,this.player.x,this.player.y);
    if(!near){
      this._goalHint.setAlpha(Math.max(0,this._goalHint.alpha-0.06));
      return;
    }

    const have=this.dataCount, req=this.requiredData;
    if(have>=req){
      this._goalHint.setText('[ E ]  RESTAURAR SISTEMA  ('+have+'/'+req+' dados ✓)');
      this._goalHint.setColor('#00FFCC');
    } else {
      this._goalHint.setText('Colete mais dados: '+have+'/'+req+' necessários');
      this._goalHint.setColor('#FF9944');
    }
    this._goalHint.setAlpha(Math.min(1,this._goalHint.alpha+0.08));

    if(have>=req&&Phaser.Input.Keyboard.JustDown(this.keyE)){
      this._startRestore();
    }
  }

  _startRestore() {
    this._restoring=true;
    this._restoreMs=0;
    this.player.body.setVelocity(0,0);
    // Congela física do jogador durante a restauração
    this.player.body.moves=false;
    this._restoreOverlay.setVisible(true);
    this._restoreOverlay.fillStyle(0x000000,0.6); this._restoreOverlay.fillRect(0,0,GW,GH);
    this._restoreTxt.setVisible(true);
    this._restoreBar.setVisible(true);
    this._goalHint.setAlpha(0);
    this.cameras.main.shake(180,0.008);
    // Pisca texto
    this.tweens.add({targets:this._restoreTxt,alpha:{from:1,to:0.4},duration:400,yoyo:true,repeat:-1});
  }

  _damage(isFirewall) {
    if(this.invincible>0) return;
    this.energy--; this.invincible=110;
    if(isFirewall){
      this.player.body.setVelocityX(this.player.body.velocity.x>0?-200:200);
      this.player.body.setVelocityY(-220);
    } else {
      this.player.body.setVelocityX(this.player.body.velocity.x>0?-150:150);
      this.player.body.setVelocityY(-160);
    }
    this.cameras.main.shake(220,0.012);
    this.cameras.main.flash(180,220,0,0,true);
    if(this.energy<=0){
      this.gameOver=true;
      this.time.delayedCall(500,()=>this.scene.start('EndScene',{
        win:false,score:this.score,data:this.dataCount,total:this.LVL.totalData,
        time:Math.floor((Date.now()-this.startTime)/1000),deaths:this.deaths,
      }));
    } else {
      this.flash('DANO! ('+this.energy+' HP)','#FF4444');
    }
  }

  _respawn() {
    this.deaths++;
    this.energy=Math.max(1,this.energy-1);
    this.player.setPosition(this.lastCpX,this.lastCpY);
    this.player.body.setVelocity(0,0);
    this.cameras.main.shake(280,0.014);
    this.invincible=100;
    this.flash('QUEDA! VOLTOU AO CHECKPOINT','#FF4444');
    if(this.energy<=0){
      this.gameOver=true;
      this.time.delayedCall(400,()=>this.scene.start('EndScene',{
        win:false,score:this.score,data:this.dataCount,total:this.LVL.totalData,
        time:Math.floor((Date.now()-this.startTime)/1000),deaths:this.deaths,
      }));
    }
  }

  _onVictory() {
    if(this.won) return; this.won=true;
    const elapsed=Math.floor((Date.now()-this.startTime)/1000);
    salvarResultadoJogo(this.score,{dadosColetados:this.dataCount,tempo:elapsed,mortes:this.deaths});
    this.cameras.main.flash(700,0,255,180);
    this.cameras.main.shake(300,0.012);
    this.time.delayedCall(1200,()=>this.scene.start('EndScene',{
      win:true,score:this.score,data:this.dataCount,total:this.LVL.totalData,
      time:elapsed,deaths:this.deaths,
    }));
  }
}

/* ═══════════════════════════════════════════════════════════════
   EndScene
═══════════════════════════════════════════════════════════════ */
class EndScene extends Phaser.Scene {
  constructor() { super('EndScene'); }
  init(d) { this.result=d; }

  create() {
    const {win,score,data,total,time,deaths}=this.result;
    const cx=GW/2,cy=GH/2;
    const bg=this.add.graphics();
    bg.fillGradientStyle(C.sky0,C.sky0,C.sky1,C.sky1,1);
    bg.fillRect(0,0,GW,GH);
    const rng=new Phaser.Math.RandomDataGenerator(['end_stars']);
    for(let i=0;i<120;i++){
      bg.fillStyle(rng.pick([0xFFFFFF,0xAADDFF,0x88CCFF]),rng.realInRange(0.2,0.7));
      bg.fillRect(rng.integerInRange(0,GW),rng.integerInRange(0,GH),1,1);
    }
    const ov=this.add.graphics();
    ov.fillStyle(win?C.neon:C.red,0.04); ov.fillRect(0,0,GW,GH);
    const p=this.add.graphics();
    p.fillStyle(0x040C18,0.96); p.fillRoundedRect(cx-340,cy-240,680,480,16);
    p.lineStyle(2,win?C.neon:C.red,0.75); p.strokeRoundedRect(cx-340,cy-240,680,480,16);

    this.add.text(cx,cy-208,win?'MISSÃO CONCLUÍDA':'SISTEMA COMPROMETIDO',{fontFamily:'monospace',fontSize:'13px',color:win?'#3EBB5A':'#E33B3B',letterSpacing:5}).setOrigin(0.5);
    const title=this.add.text(cx,cy-155,win?'PC CENTRAL':'GAME OVER',{fontFamily:'monospace',fontSize:'58px',fontStyle:'bold',color:win?'#00FFCC':'#FF4444',stroke:win?'#002211':'#330000',strokeThickness:5}).setOrigin(0.5);
    this.tweens.add({targets:title,alpha:{from:0.75,to:1},duration:1000,yoyo:true,repeat:-1});

    const stats=[['DADOS COLETADOS',`${data} / ${total}`],['TEMPO',`${Math.floor(time/60)}m ${time%60}s`],['MORTES',`${deaths}`]];
    stats.forEach(([lbl,val],i)=>{
      const row=cy-65+i*34;
      this.add.text(cx-160,row,lbl+':',{fontFamily:'monospace',fontSize:'13px',color:'#8B949E'}).setOrigin(0,0.5);
      this.add.text(cx+120,row,val,{fontFamily:'monospace',fontSize:'13px',fontStyle:'bold',color:'#C9D1D9'}).setOrigin(1,0.5);
    });

    this.add.text(cx,cy+28,String(score),{fontFamily:'monospace',fontSize:'70px',fontStyle:'bold',color:'#FFFFFF'}).setOrigin(0.5);
    this.add.text(cx,cy+88,'PONTOS',{fontFamily:'monospace',fontSize:'14px',color:'#8B949E',letterSpacing:4}).setOrigin(0.5);

    const r=score>=1200?'S':score>=800?'A':score>=500?'B':score>=250?'C':'D';
    const rc=r==='S'?'#FFD700':r==='A'?'#00FFCC':r==='B'?'#3EBB5A':'#8B949E';
    this.add.text(cx+210,cy+28,r,{fontFamily:'monospace',fontSize:'80px',fontStyle:'bold',color:rc,stroke:'#000',strokeThickness:4}).setOrigin(0.5);

    const ln=this.add.graphics();
    ln.lineStyle(1,win?C.neon:C.red,0.22); ln.lineBetween(cx-300,cy+110,cx+300,cy+110);

    this._btn(cx-100,cy+160,win?'JOGAR NOVAMENTE':'TENTAR NOVAMENTE',win?C.neon:C.red,win?0x003B22:0x330000,()=>this.scene.start('GameScene'));
    this._btn(cx+170,cy+160,'MENU',0x8B949E,0x0D1520,()=>this.scene.start('StartScene'));
    const vol=this.add.text(cx,cy+210,'← VOLTAR À PLATAFORMA',{fontFamily:'monospace',fontSize:'12px',color:'#555D68'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    vol.on('pointerover',()=>vol.setColor('#C9D1D9')); vol.on('pointerout',()=>vol.setColor('#555D68'));
    vol.on('pointerdown',()=>voltarPlataforma());
  }

  _btn(x,y,label,col,bg,cb) {
    const w=label.length*9+36,h=44;
    const r=this.add.rectangle(x,y,w,h,bg,1).setStrokeStyle(2,col).setInteractive({useHandCursor:true});
    const t=this.add.text(x,y,label,{fontFamily:'monospace',fontSize:'14px',fontStyle:'bold',color:'#'+col.toString(16).padStart(6,'0')}).setOrigin(0.5).setInteractive({useHandCursor:true});
    r.on('pointerover',()=>r.setFillStyle(col,0.2)); r.on('pointerout',()=>r.setFillStyle(bg,1));
    r.on('pointerdown',cb); t.on('pointerdown',cb);
    t.on('pointerover',()=>r.setFillStyle(col,0.2)); t.on('pointerout',()=>r.setFillStyle(bg,1));
  }
}

/* ═══════════════════════════════════════════════════════════════ */
const game=new Phaser.Game({
  type:Phaser.AUTO, backgroundColor:'#020810',
  physics:{default:'arcade',arcade:{gravity:{y:0},debug:false}},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,parent:'gameContainer',width:GW,height:GH},
  scene:[BootScene,StartScene,GameScene,EndScene],
});
