// ── Hacker Runner — standalone game ──────────────────────────

function voltarPlataforma() {
  window.location.href = '../../index.html';
}

function lerAlunoId() {
  return new URLSearchParams(window.location.search).get('alunoId') || '';
}

function salvarResultadoJogo(pts) {
  const result = {
    alunoId: lerAlunoId(),
    gameId: 'hacker-runner',
    moduloId: new URLSearchParams(window.location.search).get('moduloId') || 'hardware',
    status: 'completed',
    score: pts,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('lusca_pending_game_result', JSON.stringify(result));
}

// =============================================================
// HACKER RUNNER v3 — fixed collision, quiz items, polish
// =============================================================

'use strict'; // eslint-disable-line
const GW=480,GH=270,TS=16;
const GRAV=0.30,MAX_FALL=9;

// ── LEVEL MAP ────────────────────────────────────────────────
// # = solid ground (all sides)   p = one-way platform (land from top only)
// . = empty  P = player start    D = data packet   V = virus
// F = firewall (2 tiles tall)    C = checkpoint    X = PC Central
const MAP=[
//          1111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000
//0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012
  "..............................................................................................................",
  "..............................................................................................................",
  "..........D......D.................................D.................................D..................D......",
  "........ppppp....p...........ppppp.................ppp.......................ppppp.......ppp...........ppp....",
  "..P.D..........................D.....V.........D.............V.........D...................D.............D..X.",
  "....ppp.........D..........ppp.....ppp.......pppp.........ppp.........ppp.........ppppp.......ppp.....ppppp.",
  ".............ppppp.......F.........F....C....F..............F.....C.....F..............................F.....",
  "############.....#######.##########.####.####.########.####.#####.#####.################.########.....#####.",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
  "..............................................................................................................",
];

// ── HARDWARE QUIZ ────────────────────────────────────────────
// Questions are directly tied to the Hardware module content
const QUIZ=[
  {q:"O que define HARDWARE?",opts:["Programas instalados no PC","Parte fisica que podemos tocar","A conexao com a internet"],c:1,item:"double_jump",itemName:"SALTO DUPLO"},
  {q:"CPU e o 'cerebro' do computador. CPU significa:",opts:["Central Processing Unit","Computer Power Unit","Control Program Utility"],c:0,item:"speed",itemName:"VELOCIDADE"},
  {q:"Qual componente guarda dados temporariamente enquanto o PC funciona?",opts:["HD (disco rigido)","Placa de video","Memoria RAM"],c:2,item:"shield",itemName:"ESCUDO"},
  {q:"Teclado e um hardware de:",opts:["Saida (mostra resultado)","Entrada (manda dados pro PC)","Processamento"],c:1,item:"double_jump",itemName:"SALTO DUPLO"},
  {q:"Monitor e um hardware de:",opts:["Entrada","Processamento","Saida (exibe resultado)"],c:2,item:"speed",itemName:"VELOCIDADE"},
  {q:"SSD e HD sao dispositivos de:",opts:["Processamento","Armazenamento permanente","Entrada de dados"],c:1,item:"shield",itemName:"ESCUDO"},
  {q:"Placa-mae serve para:",opts:["Exibir imagens na tela","Conectar todos os componentes","Guardar arquivos"],c:1,item:"double_jump",itemName:"SALTO DUPLO"},
  {q:"O que e um periferico?",opts:["Hardware extra conectado ao PC","Tipo de virus","Programa de seguranca"],c:0,item:"speed",itemName:"VELOCIDADE"},
];

// ── STATE ────────────────────────────────────────────────────
let canvas,ctx,animId=null;
let map,player,particles=[],bgPts=[];
let gameState='idle',keys={},time=0;
let score=0,dataCount=0,totalData=0;
let lastCheckpoint=null,flashMsg={txt:'',t:0,col:'#00FFCC'};
let shakeT=0,shakeX=0,shakeY=0;
let items={double_jump:false,speed:false,shield:false};
let extraJumps=0;
let quizQueue=[],activeQuiz=null,quizIdx=0;
let dataForQuiz=0; // trigger quiz every 3 collectibles

function mkPlayer(x,y){
  return{x,y,w:12,h:22,vx:0,vy:0,grounded:false,facing:1,
         anim:0,animT:0,energy:5,invincible:0,coyote:0,extraJumps:0};
}

// ── INIT ─────────────────────────────────────────────────────
function hrInit(){
  canvas=document.getElementById('hrCanvas');
  canvas.width=GW;canvas.height=GH;
  canvas.style.width='100%';
  canvas.style.imageRendering='pixelated';
  ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  function onKey(e,d){
    keys[e.code]=d;
    if(['Space','ArrowUp','ArrowLeft','ArrowRight','KeyW','KeyA','KeyD'].includes(e.code))e.preventDefault();
  }
  document.addEventListener('keydown',e=>onKey(e,true));
  document.addEventListener('keyup',e=>onKey(e,false));
  let tx0=0;
  canvas.addEventListener('touchstart',e=>{tx0=e.touches[0].clientX;keys['Space']=true;setTimeout(()=>{keys['Space']=false;},120);},{passive:true});
  canvas.addEventListener('touchmove',e=>{const d=e.touches[0].clientX-tx0;keys['ArrowLeft']=d<-20;keys['ArrowRight']=d>20;},{passive:true});
  canvas.addEventListener('touchend',()=>{keys['ArrowLeft']=keys['ArrowRight']=false;},{passive:true});
  // init bg
  bgPts=[];for(let i=0;i<50;i++)bgPts.push(mkBgPt(true));
}

function mkBgPt(init){
  return{x:Math.random()*GW*3,y:init?Math.random()*GH:GH+2,
    vy:-(0.1+Math.random()*0.25),size:Math.random()<0.4?2:1,
    col:Math.random()<0.5?'#00FFCC':'#388BFD',alpha:0.08+Math.random()*0.2,
    life:100+Math.random()*300|0};
}

// ── PUBLIC API ────────────────────────────────────────────────
function hrShowStart(){
  const ov=document.getElementById('hrOverlay');
  if(ov){ov.style.display='flex';ov.innerHTML=startScreenHTML();}
}

window.hrStart=function(){
  document.getElementById('hrOverlay').style.display='none';
  document.getElementById('hrQuestion').style.display='none';
  if(!canvas)hrInit();
  // parse map
  const parsed=parseMap(MAP);
  map=parsed;
  player=mkPlayer(map.playerStart.x,map.playerStart.y);
  totalData=map.collectibles.length;
  dataCount=0;dataForQuiz=0;
  particles=[];keys={};time=0;score=0;
  lastCheckpoint=null;flashMsg={txt:'',t:0,col:'#00FFCC'};
  shakeT=0;items={double_jump:false,speed:false,shield:false};
  activeQuiz=null;quizQueue=[...QUIZ].sort(()=>Math.random()-0.5);quizIdx=0;
  gameState='playing';
  if(animId)cancelAnimationFrame(animId);
  loop();
};

window.hrAnswerQuiz=function(idx){
  if(!activeQuiz)return;
  const correct=idx===activeQuiz.c;
  if(correct){
    items[activeQuiz.item]=true;
    score+=50;
    flash('CORRETO! +50 PTS  ITEM DESBLOQUEADO: '+activeQuiz.itemName,'#00FFCC');
    spawnP(player.x+player.w/2,player.y,'#00FFCC',12,3,2);
  } else {
    flash('INCORRETO — '+activeQuiz.opts[activeQuiz.c],'#FF4444');
  }
  document.getElementById('hrQuestion').style.display='none';
  activeQuiz=null;
  gameState='playing';
};

function startScreenHTML(){
  return`<div style="text-align:center;padding:16px;">
    <div style="font-size:clamp(7px,1.2vw,10px);color:#3FB950;letter-spacing:3px;margin-bottom:4px;">MODULO HARDWARE</div>
    <div style="font-size:clamp(18px,4.5vw,36px);font-weight:900;color:#00FFCC;letter-spacing:4px;text-shadow:0 0 18px #00FFCC66;margin-bottom:2px;">HACKER RUNNER</div>
    <div style="font-size:clamp(7px,1.2vw,10px);color:#58A6FF;letter-spacing:2px;margin-bottom:16px;">INFILTRE A REDE  |  COLETE OS DADOS  |  PC CENTRAL</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;max-width:260px;margin:0 auto 16px;font-size:clamp(7px,1.2vw,9px);color:#8B949E;">
      <div style="background:#0D1520;border:1px solid #21262D;border-radius:3px;padding:5px;">[SETAS] MOVER</div>
      <div style="background:#0D1520;border:1px solid #21262D;border-radius:3px;padding:5px;">[SPACE] PULAR</div>
      <div style="background:#0D1520;border:1px solid #21262D;border-radius:3px;padding:5px;">[CIMA em virus] DESTRUIR</div>
      <div style="background:#0D1520;border:1px solid #21262D;border-radius:3px;padding:5px;">[WASD] alternativo</div>
    </div>
    <div style="font-size:clamp(7px,1.2vw,9px);color:#FFDD57;margin-bottom:14px;letter-spacing:1px;">Colete dados para desbloquear itens respondendo questoes de hardware!</div>
    <button onclick="hrStart()" style="background:linear-gradient(135deg,#00FFCC,#00AA88);color:#000;border:none;font-family:inherit;font-size:clamp(11px,2.5vw,15px);font-weight:900;padding:10px 36px;border-radius:4px;cursor:pointer;letter-spacing:2px;">INICIAR FASE</button><br>
    <button onclick="voltarPlataforma()" style="margin-top:8px;background:transparent;color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(9px,1.5vw,11px);padding:7px 20px;border-radius:4px;cursor:pointer;">VOLTAR</button>
  </div>`;
}

// ── PARSE MAP ─────────────────────────────────────────────────
function parseMap(raw){
  const tiles=[],collectibles=[],enemies=[],firewalls=[],checkpoints=[];
  let playerStart={x:2*TS,y:5*TS},goalPos=null;
  raw.forEach((row,ry)=>{
    row.split('').forEach((ch,cx)=>{
      const px=cx*TS,py=ry*TS,seed=(cx*7+ry*13)%16;
      if(ch==='#'||ch==='p') tiles.push({x:px,y:py,w:TS,h:TS,type:ch,seed});
      if(ch==='D') collectibles.push({x:px+3,y:py+3,w:10,h:10,alive:true,t:Math.random()*6.28});
      if(ch==='V'){
        const fast=Math.random()<0.25;
        enemies.push({x:px,y:py,w:14,h:16,vx:fast?-1.0:-0.65,alive:true,
          t:0,startX:px,rangeX:60,type:fast?1:0,deathT:0,dying:false});
      }
      if(ch==='F') firewalls.push({x:px,y:py,w:TS,h:TS*3,t:0});
      if(ch==='C') checkpoints.push({x:px,y:py,w:TS,h:TS*2,activated:false,t:0});
      if(ch==='P') playerStart={x:px,y:py-TS};
      if(ch==='X') goalPos={x:px,y:py-TS*3,w:TS*3,h:TS*4};
    });
  });
  return{tiles,collectibles,enemies,firewalls,checkpoints,playerStart,goalPos};
}

// ── COLLISION — KEY FIX ───────────────────────────────────────
// '#' tiles: solid on all 4 sides
// 'p' tiles: ONE-WAY — only land from above, never block sideways or from below
function overlap(a,b){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

function resolveX(ent){
  for(const t of map.tiles){
    if(t.type==='p') continue; // platforms never block X movement
    if(!overlap(ent,t)) continue;
    if(ent.vx>0) ent.x=t.x-ent.w;
    else if(ent.vx<0) ent.x=t.x+t.w;
    ent.vx=0;
  }
}

function resolveY(ent,wasGnd){
  for(const t of map.tiles){
    if(t.type==='p'){
      // One-way: only when falling, and entity's bottom was above platform top last frame
      if(ent.vy>=0){
        const prevBottom=ent.y+ent.h-ent.vy;
        if(prevBottom<=t.y+3&&overlap(ent,t)){
          ent.y=t.y-ent.h;ent.vy=0;ent.grounded=true;
          if(ent===player) ent.extraJumps=items.double_jump?1:0;
        }
      }
    } else {
      if(!overlap(ent,t)) continue;
      if(ent.vy>=0){ent.y=t.y-ent.h;ent.vy=0;ent.grounded=true;
        if(ent===player) ent.extraJumps=items.double_jump?1:0;}
      else if(ent.vy<0){ent.y=t.y+t.h;ent.vy=0;}
    }
  }
  if(ent===player&&wasGnd&&!ent.grounded) ent.coyote=7;
}

// ── PARTICLES ─────────────────────────────────────────────────
function spawnP(x,y,col,n,spread,up){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,s=0.8+Math.random()*(spread||2);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-(up||1.5),
      col,life:16+Math.random()*24|0,maxLife:40,size:1+Math.random()*2|0});
  }
}
function spawnRing(x,y,col){
  particles.push({ring:true,x,y,r:2,maxR:16,col,life:12,maxLife:12});
}
function shake(s){shakeT=s;}
function flash(txt,col){flashMsg={txt,t:90,col:col||'#00FFCC'};}

// ── QUIZ TRIGGER ──────────────────────────────────────────────
function triggerQuiz(){
  if(quizIdx>=quizQueue.length) return;
  activeQuiz=quizQueue[quizIdx++];
  gameState='quiz';
  const qel=document.getElementById('hrQuestion');
  qel.style.display='block';
  qel.innerHTML=`
    <div style="font-size:clamp(7px,1.1vw,9px);color:#00FFCC;letter-spacing:2px;margin-bottom:8px;">DADO COLETADO — QUESTAO DE HARDWARE</div>
    <div style="font-size:clamp(10px,1.8vw,14px);font-weight:700;color:#E6EDF3;margin-bottom:14px;line-height:1.4;">${activeQuiz.q}</div>
    ${activeQuiz.opts.map((o,i)=>`
    <button onclick="hrAnswerQuiz(${i})" style="display:block;width:100%;margin-bottom:6px;background:#0D1A2E;border:1px solid #30363D;color:#E6EDF3;font-family:inherit;font-size:clamp(9px,1.5vw,12px);padding:7px 10px;border-radius:4px;cursor:pointer;text-align:left;letter-spacing:0.5px;">
      <span style="color:#388BFD;margin-right:6px;">${['A','B','C'][i]})</span>${o}
    </button>`).join('')}
    <div style="font-size:clamp(7px,1vw,9px);color:#8B949E;margin-top:6px;">Resposta certa desbloqueia: <span style="color:#FFDD57;">${activeQuiz.itemName}</span></div>
  `;
}

// ── UPDATE ────────────────────────────────────────────────────
function update(){
  time++;
  const p=player;

  // shake decay
  if(shakeT>0){shakeT--;shakeX=(Math.random()-0.5)*shakeT*0.6;shakeY=(Math.random()-0.5)*shakeT*0.5;}
  else{shakeX=0;shakeY=0;}

  const spd=items.speed?2.4:1.9;
  const left=keys['ArrowLeft']||keys['KeyA'];
  const right=keys['ArrowRight']||keys['KeyD'];
  const jump=keys['Space']||keys['ArrowUp']||keys['KeyW'];

  if(left){p.vx=-spd;p.facing=-1;}
  else if(right){p.vx=spd;p.facing=1;}
  else p.vx*=0.65;

  const canJump=p.grounded||p.coyote>0;
  const canExtraJump=!p.grounded&&p.extraJumps>0&&items.double_jump;

  if(jump&&(canJump||canExtraJump)){
    if(!canJump&&canExtraJump) p.extraJumps--;
    p.vy=-5.8;p.grounded=false;p.coyote=0;
    spawnP(p.x+p.w/2,p.y+p.h,'#8B949E',4,1.2,0.3);
    keys['Space']=false;keys['ArrowUp']=false;keys['KeyW']=false;
  }

  p.vy=Math.min(p.vy+GRAV,MAX_FALL);
  if(p.coyote>0) p.coyote--;
  if(p.invincible>0) p.invincible--;

  // animation
  p.animT++;
  const moving=Math.abs(p.vx)>0.4;
  if(moving&&p.grounded&&p.animT%8===0) p.anim=(p.anim+1)%4;
  else if(!p.grounded) p.anim=2;

  // running dust
  if(moving&&p.grounded&&p.animT%14===0)
    particles.push({x:p.x+p.w/2,y:p.y+p.h,vx:(Math.random()-0.5)*0.4,vy:-0.2,
      col:'rgba(100,160,200,0.3)',life:10,maxLife:10,size:3});

  // move X first, then Y — prevents corner sticking
  p.x+=p.vx; resolveX(p);
  const wasGnd=p.grounded; p.grounded=false;
  p.y+=p.vy; resolveY(p,wasGnd);

  // enemies
  map.enemies.forEach(en=>{
    if(!en.alive){if(en.dying)en.deathT++;return;}
    en.t+=en.type===1?0.16:0.10;
    en.x+=en.vx;
    if(en.x<en.startX-en.rangeX||en.x>en.startX+en.rangeX) en.vx*=-1;
    // enemies only collide with ground tiles for resolution
    for(const t of map.tiles){
      if(t.type==='p') continue;
      if(!overlap(en,t)) continue;
      if(en.vx>0) en.x=t.x-en.w; else en.x=t.x+t.w; en.vx*=-1;
    }
    if(overlap(p,en)){
      const stomp=p.vy>0&&(p.y+p.h)<(en.y+8);
      if(stomp){
        en.alive=false;en.dying=true;
        p.vy=-4.5;score+=25;
        spawnP(en.x+en.w/2,en.y+en.h/2,'#9B59B6',12,3,2);
        spawnP(en.x+en.w/2,en.y+en.h/2,'#FF6688',6,2,1.5);
        spawnRing(en.x+en.w/2,en.y+en.h/2,'#9B59B6');
        flash('VIRUS DESTRUIDO  +25','#CC88FF');
      } else if(p.invincible===0){
        if(items.shield){
          items.shield=false;flash('ESCUDO ATIVADO!','#FFDD57');shake(6);
        } else {
          p.energy--;p.invincible=90;shake(10);
          spawnP(p.x+p.w/2,p.y+p.h/2,'#DA3633',8,2,1.5);
          flash('DANO!','#FF4444');
          if(p.energy<=0){gameState='gameover';setTimeout(()=>showEnd(false),500);}
        }
      }
    }
  });

  // collectibles
  map.collectibles.forEach(d=>{
    if(!d.alive) return;
    d.t+=0.07;
    if(overlap(p,d)){
      d.alive=false;score+=10;dataCount++;dataForQuiz++;
      spawnRing(d.x+d.w/2,d.y+d.h/2,'#00FFCC');
      spawnRing(d.x+d.w/2,d.y+d.h/2,'#FFFFFF');
      spawnP(d.x+d.w/2,d.y+d.h/2,'#00FFCC',8,2.5,2);
      flash('DADO COLETADO  +10','#00FFCC');
      // trigger quiz every 3 collected
      if(dataForQuiz%3===0&&quizIdx<quizQueue.length){
        setTimeout(()=>triggerQuiz(),300);
      }
    }
  });

  // firewalls
  map.firewalls.forEach(fw=>{
    fw.t+=0.09;
    if(p.invincible===0&&overlap(p,fw)){
      if(items.shield){items.shield=false;flash('ESCUDO ATIVADO!','#FFDD57');shake(6);}
      else{
        p.energy--;p.invincible=90;
        p.vx=p.vx>0?-3.5:3.5;p.vy=-2.5;
        shake(12);spawnP(p.x+p.w/2,p.y+p.h/2,'#FF4500',10,3,2);
        flash('FIREWALL!','#FF4500');
        if(p.energy<=0){gameState='gameover';setTimeout(()=>showEnd(false),500);}
      }
    }
  });

  // checkpoints
  map.checkpoints.forEach(cp=>{
    cp.t+=0.05;
    if(!cp.activated&&overlap(p,cp)){
      cp.activated=true;
      lastCheckpoint={x:cp.x,y:cp.y-p.h};
      flash('CHECKPOINT!','#FFDD57');
      spawnP(cp.x+cp.w/2,cp.y+cp.h/2,'#FFDD57',14,2.5,2);
    }
  });

  // goal
  if(map.goalPos&&overlap(p,map.goalPos)){
    gameState='victory';score+=100;
    spawnP(map.goalPos.x+map.goalPos.w/2,map.goalPos.y,'#00FFCC',20,4,3);
    setTimeout(()=>showEnd(true),700);
  }

  // void death
  if(p.y>GH+50){
    const r=lastCheckpoint||map.playerStart;
    p.x=r.x;p.y=r.y;p.vx=0;p.vy=0;
    p.energy=Math.max(1,p.energy-1);shake(8);flash('QUEDA!','#FF4444');
    if(p.energy<=0){gameState='gameover';setTimeout(()=>showEnd(false),500);}
  }

  // particle update
  particles=particles.filter(pt=>pt.life>0);
  particles.forEach(pt=>{
    if(pt.ring){pt.r+=(pt.maxR-2)/pt.maxLife*1.5;pt.life--;}
    else{pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.18;pt.life--;}
  });

  // bg pts
  bgPts.forEach(pt=>{pt.y+=pt.vy;pt.life--;});
  bgPts=bgPts.filter(pt=>pt.life>0);
  while(bgPts.length<50) bgPts.push(mkBgPt(false));

  if(flashMsg.t>0) flashMsg.t--;
}

// ── RENDER ────────────────────────────────────────────────────
function render(){
  const levelW=MAP[0].length*TS;
  const camX=player?Math.max(0,Math.min(player.x-GW/2+player.w/2,levelW-GW)):0;

  // sky gradient
  const bg=ctx.createLinearGradient(0,0,0,GH);
  bg.addColorStop(0,'#020810');bg.addColorStop(0.5,'#060F20');bg.addColorStop(1,'#0A1530');
  ctx.fillStyle=bg;ctx.fillRect(0,0,GW,GH);

  drawBg(camX);

  ctx.save();ctx.translate(shakeX|0,shakeY|0);
  ctx.save();ctx.translate(-(camX|0),0);

  map&&map.tiles.forEach(drawTile);
  map&&map.firewalls.forEach(drawFirewall);
  map&&map.checkpoints.forEach(drawCheckpoint);
  map&&map.goalPos&&drawGoal(map.goalPos);
  map&&map.collectibles.forEach(d=>{if(d.alive)drawData(d);});
  map&&map.enemies.forEach(en=>{if(en.alive||(en.dying&&en.deathT<14))drawVirus(en);});

  // particles (world space)
  ctx.lineWidth=1;
  particles.forEach(pt=>{
    const a=pt.life/pt.maxLife;
    if(pt.ring){
      ctx.strokeStyle=pt.col;ctx.globalAlpha=a;
      ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.stroke();
    } else {
      ctx.globalAlpha=a;ctx.fillStyle=pt.col;
      ctx.fillRect(pt.x|0,pt.y|0,pt.size,pt.size);
    }
  });
  ctx.globalAlpha=1;

  player&&drawPlayer(player);
  ctx.restore();

  drawHUD();

  if(flashMsg.t>0){
    ctx.globalAlpha=Math.min(1,flashMsg.t/18);
    ctx.fillStyle=flashMsg.col;
    ctx.font='bold 8px monospace';ctx.textAlign='center';
    ctx.fillText(flashMsg.txt,GW/2,26);
  }
  ctx.globalAlpha=1;ctx.textAlign='left';
  ctx.restore();
}

// ── BACKGROUND ───────────────────────────────────────────────
function drawBg(camX){
  // floating particles
  bgPts.forEach(pt=>{
    const rx=((pt.x-camX*0.03+GW*4)%(GW*2));
    if(rx>GW) return;
    ctx.globalAlpha=pt.alpha*(pt.life/300);
    ctx.fillStyle=pt.col;
    ctx.fillRect(rx|0,pt.y|0,pt.size,pt.size);
  });
  ctx.globalAlpha=1;

  // far buildings/servers
  const off1=(camX*0.15)%(GW*2);
  const blds=[{w:14,h:58},{w:20,h:85},{w:10,h:38},{w:24,h:100},{w:16,h:62},
    {w:18,h:75},{w:10,h:42},{w:22,h:90},{w:14,h:55},{w:20,h:68},
    {w:16,h:82},{w:12,h:44},{w:18,h:62}];
  let bx=-off1;
  blds.forEach((b,bi)=>{
    const baseY=GH-b.h-36;
    ctx.fillStyle='rgba(4,16,36,0.8)';ctx.fillRect(bx|0,baseY,b.w,b.h);
    ctx.fillStyle='rgba(20,50,90,0.4)';
    for(let ry=baseY+3;ry<baseY+b.h-3;ry+=8) ctx.fillRect(bx+1|0,ry,b.w-2,5);
    for(let li=0;li<3;li++){
      const on=Math.sin(time*0.04+bx*0.08+li*1.7)>0;
      ctx.fillStyle=on?(['rgba(0,255,100,0.7)','rgba(56,139,253,0.7)','rgba(255,180,0,0.6)'][li%3]):'rgba(5,15,30,0.5)';
      ctx.fillRect(bx+b.w-5|0,baseY+5+li*5,3,3);
    }
    bx+=b.w+10;
    if(bx>GW*2+60) bx-=GW*2+300;
  });

  // grid
  ctx.strokeStyle='rgba(0,255,204,0.04)';ctx.lineWidth=0.5;
  const off2=(camX*0.40)%32;
  for(let x=-off2;x<GW+32;x+=32){ctx.beginPath();ctx.moveTo(x|0,0);ctx.lineTo(x|0,GH);ctx.stroke();}
  for(let y=0;y<GH;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(GW,y);ctx.stroke();}

  // data streams
  ctx.lineWidth=1;
  [[38,1.1,'rgba(0,180,255,0.12)'],[130,0.7,'rgba(0,255,180,0.1)'],
   [220,1.4,'rgba(80,140,255,0.08)'],[320,0.9,'rgba(0,200,150,0.1)'],[430,1.2,'rgba(0,150,255,0.09)']
  ].forEach(([sx,sp,col])=>{
    const rx=((sx-camX*0.45+GW*6)%GW);
    const oy=(time*sp*0.6)%GH;
    ctx.strokeStyle=col;ctx.globalAlpha=0.7;
    ctx.beginPath();ctx.moveTo(rx|0,oy-24);ctx.lineTo(rx|0,oy);ctx.stroke();
    ctx.globalAlpha=0.2;
    ctx.beginPath();ctx.moveTo(rx|0,oy);ctx.lineTo(rx|0,oy+36);ctx.stroke();
  });
  ctx.globalAlpha=1;ctx.lineWidth=1;
}

// ── TILES ─────────────────────────────────────────────────────
function drawTile(t){
  if(t.type==='#'){
    // Motherboard ground
    ctx.fillStyle='#081520';ctx.fillRect(t.x,t.y,TS,TS);
    ctx.fillStyle='#0C2240';ctx.fillRect(t.x+1,t.y+1,TS-2,TS-2);
    // circuit traces
    ctx.fillStyle='rgba(0,200,160,0.30)';
    if(t.seed&1){ctx.fillRect(t.x+2,t.y+TS-4,TS-4,1);}
    if(t.seed&2){ctx.fillRect(t.x+TS-3,t.y+2,1,TS-4);}
    if(t.seed&4){ctx.fillRect(t.x+2,t.y+6,6,1);}
    if(t.seed&8){ctx.fillRect(t.x+8,t.y+3,1,6);}
    // solder pads
    ctx.fillStyle='rgba(0,255,204,0.50)';
    ctx.fillRect(t.x+2,t.y+2,2,2);
    if(t.seed&3) ctx.fillRect(t.x+TS-4,t.y+2,2,2);
    // top illuminated edge
    ctx.fillStyle='rgba(56,139,253,0.55)';ctx.fillRect(t.x,t.y,TS,1);
    ctx.fillStyle='rgba(0,80,160,0.3)';ctx.fillRect(t.x,t.y+1,TS,1);
    // bottom shadow
    ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(t.x,t.y+TS-1,TS,1);
  } else {
    // One-way server platform
    ctx.fillStyle='#111E30';ctx.fillRect(t.x,t.y,TS,TS);
    ctx.fillStyle='#1A2D46';ctx.fillRect(t.x+1,t.y+1,TS-2,TS-2);
    // top bright edge (makes it look like a ledge)
    ctx.fillStyle='rgba(80,150,230,0.55)';ctx.fillRect(t.x,t.y,TS,2);
    ctx.fillStyle='rgba(0,255,204,0.20)';ctx.fillRect(t.x,t.y,TS,1);
    // drive slots
    ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(t.x+2,t.y+4,TS-4,2);ctx.fillRect(t.x+2,t.y+9,TS-4,2);
    // LEDs
    const g=Math.sin(time*0.07+t.x*0.2)>0;
    ctx.fillStyle=g?'#3FB950':'#111E30';ctx.fillRect(t.x+TS-5,t.y+4,2,2);
    const b=Math.sin(time*0.05+t.x*0.4+2)>0.3;
    ctx.fillStyle=b?'#388BFD':'#111E30';ctx.fillRect(t.x+TS-5,t.y+8,2,2);
  }
}

// ── FIREWALL ──────────────────────────────────────────────────
function drawFirewall(fw){
  const a=0.5+Math.sin(fw.t)*0.4;
  // outer glow
  ctx.fillStyle=`rgba(255,60,0,${a*0.2})`;ctx.fillRect(fw.x-4,fw.y-2,fw.w+8,fw.h+4);
  // columns
  ctx.fillStyle=`rgba(200,30,10,${a})`;ctx.fillRect(fw.x+3,fw.y,fw.w-6,fw.h);
  ctx.fillStyle=`rgba(255,120,0,${a})`;ctx.fillRect(fw.x+2,fw.y,2,fw.h);ctx.fillRect(fw.x+fw.w-4,fw.y,2,fw.h);
  // heat lines
  ctx.fillStyle='rgba(0,0,0,0.3)';
  for(let sy=fw.y;sy<fw.y+fw.h;sy+=3) ctx.fillRect(fw.x+3,sy,fw.w-6,1);
  // label
  ctx.fillStyle=`rgba(255,200,60,${a})`;ctx.font='5px monospace';
  ctx.fillText('BLOCK',fw.x+1,fw.y+8);ctx.fillText('=====',fw.x+1,fw.y+14);
  // heat sparks top
  if(Math.sin(fw.t*3)>0.6){
    ctx.fillStyle='rgba(255,200,0,0.7)';
    ctx.fillRect(fw.x+5,fw.y-3,2,2);ctx.fillRect(fw.x+9,fw.y-2,1,2);
  }
}

// ── CHECKPOINT ────────────────────────────────────────────────
function drawCheckpoint(cp){
  const ac=cp.activated;
  const p2=ac?(0.5+Math.sin(cp.t)*0.35):0.35;
  ctx.fillStyle=ac?'#3FB950':'#586069';ctx.fillRect(cp.x+7,cp.y,2,cp.h);
  ctx.fillStyle=ac?`rgba(63,185,80,${p2})`:'rgba(80,100,130,0.5)';ctx.fillRect(cp.x+9,cp.y,10,8);
  ctx.fillStyle=ac?'rgba(200,255,200,0.9)':'rgba(80,100,120,0.5)';ctx.fillRect(cp.x+10,cp.y+1,8,6);
  if(ac){ctx.fillStyle=`rgba(63,185,80,0.12)`;ctx.fillRect(cp.x-4,cp.y,20,cp.h);}
}

// ── PC CENTRAL ───────────────────────────────────────────────
function drawGoal(g){
  const gl=0.55+Math.sin(time*0.05)*0.3;
  // pulsing aura
  ctx.fillStyle=`rgba(0,255,180,${gl*0.12})`;ctx.fillRect(g.x-8,g.y-6,g.w+16,g.h+12);
  ctx.strokeStyle=`rgba(0,255,180,${gl*0.55})`;ctx.lineWidth=2;
  ctx.strokeRect(g.x-4,g.y-2,g.w+8,g.h+4);ctx.lineWidth=1;
  // body
  ctx.fillStyle='#0A1828';ctx.fillRect(g.x,g.y+8,g.w,g.h-8);
  ctx.fillStyle='#142030';ctx.fillRect(g.x+1,g.y+9,g.w-2,g.h-10);
  // screen
  const sg=ctx.createLinearGradient(g.x+4,g.y+14,g.x+4,g.y+g.h-16);
  sg.addColorStop(0,`rgba(0,255,180,${gl*0.95})`);sg.addColorStop(1,`rgba(0,100,70,${gl*0.6})`);
  ctx.fillStyle=sg;ctx.fillRect(g.x+4,g.y+14,g.w-8,g.h-28);
  // scanlines
  ctx.fillStyle='rgba(0,0,0,0.18)';
  for(let sy=g.y+14;sy<g.y+g.h-14;sy+=3) ctx.fillRect(g.x+4,sy,g.w-8,1);
  // terminal text
  ctx.fillStyle=`rgba(220,255,235,${gl})`;ctx.font='5px monospace';
  ctx.fillText('PC',g.x+8,g.y+24);ctx.fillText('CTRL',g.x+6,g.y+31);
  ctx.fillText('>'+(Math.floor(time/15)%2?'_':' '),g.x+8,g.y+38);
  // base
  ctx.fillStyle='#060E1A';ctx.fillRect(g.x+2,g.y+g.h-5,g.w-4,5);
  // cables
  ctx.strokeStyle=`rgba(0,200,140,${gl*0.6})`;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(g.x+7,g.y+g.h);ctx.lineTo(g.x+7,g.y+g.h+10);ctx.stroke();
  ctx.beginPath();ctx.moveTo(g.x+g.w-7,g.y+g.h);ctx.lineTo(g.x+g.w-7,g.y+g.h+10);ctx.stroke();
  ctx.lineWidth=1;
  // label above
  ctx.fillStyle=`rgba(0,255,180,${gl*0.8})`;ctx.font='6px monospace';ctx.textAlign='center';
  ctx.fillText('PC CENTRAL',g.x+g.w/2,g.y+5);ctx.textAlign='left';
  // ambient rising particles
  if(time%5===0) spawnP(g.x+4+Math.random()*(g.w-8),g.y,'#00FFCC',1,0.4,1.2);
}

// ── DATA PACKET ───────────────────────────────────────────────
function drawData(d){
  const fl=0.45+Math.sin(d.t)*0.45;
  const fy=Math.sin(d.t*0.9)*2.5;
  const dx=d.x|0,dy=(d.y+fy)|0;
  // outer aura
  ctx.fillStyle=`rgba(0,255,204,${fl*0.18})`;ctx.fillRect(dx-4,dy-4,d.w+8,d.h+8);
  // mid ring
  ctx.fillStyle=`rgba(0,220,180,${fl*0.45})`;ctx.fillRect(dx-1,dy-1,d.w+2,d.h+2);
  // core gradient
  const dg=ctx.createLinearGradient(dx,dy,dx+d.w,dy+d.h);
  dg.addColorStop(0,`rgba(120,255,230,${fl})`);dg.addColorStop(1,`rgba(0,180,140,${fl})`);
  ctx.fillStyle=dg;ctx.fillRect(dx,dy,d.w,d.h);
  // highlight
  ctx.fillStyle=`rgba(255,255,255,${fl*0.6})`;ctx.fillRect(dx+1,dy+1,4,4);
  // inner
  ctx.fillStyle=`rgba(0,60,40,${fl*0.4})`;ctx.fillRect(dx+3,dy+1,4,d.h-2);ctx.fillRect(dx+1,dy+3,d.w-2,4);
  // corner sparks
  if(fl>0.85){ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(dx-1,dy-1,1,1);ctx.fillRect(dx+d.w,dy-1,1,1);}
}

// ── VIRUS ─────────────────────────────────────────────────────
function drawVirus(en){
  if(en.dying){
    const dt=en.deathT;
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+dt*0.15;const r=dt*2.2;
      ctx.globalAlpha=Math.max(0,(1-dt/14)*0.9);
      ctx.fillStyle=i%2?'#9B59B6':'#FF6688';
      ctx.fillRect((en.x+en.w/2+Math.cos(a)*r)|0,(en.y+en.h/2+Math.sin(a)*r)|0,3,3);
    }
    ctx.globalAlpha=1;return;
  }
  const wob=Math.sin(en.t)*1.8;
  const ex=en.x|0,ey=(en.y+wob)|0;
  const t1=en.type===1;
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(ex+2,ey+en.h,en.w-4,2);
  // body
  ctx.fillStyle=t1?'#8B1A4A':'#4E1580';
  ctx.fillRect(ex+2,ey+5,en.w-4,en.h-7);ctx.fillRect(ex+4,ey+2,en.w-8,en.h-4);
  // spikes
  ctx.fillStyle=t1?'#CC2266':'#7B2FBE';
  ctx.fillRect(ex,ey+6,2,5);ctx.fillRect(ex+en.w-2,ey+6,2,5);ctx.fillRect(ex+5,ey,4,2);
  // eyes (blink)
  const eyeOpen=Math.sin(en.t*2.5)>-0.6;
  ctx.fillStyle='#FF3333';ctx.fillRect(ex+3,ey+5,3,eyeOpen?3:1);ctx.fillRect(ex+en.w-6,ey+5,3,eyeOpen?3:1);
  if(eyeOpen){ctx.fillStyle='#FFAAAA';ctx.fillRect(ex+4,ey+6,1,1);ctx.fillRect(ex+en.w-5,ey+6,1,1);}
  // legs (walk anim)
  const leg=Math.sin(en.t*4)>0;
  ctx.fillStyle=t1?'#AA1155':'#6B2FAE';
  ctx.fillRect(ex+3,ey+en.h-5,3,leg?5:3);ctx.fillRect(ex+en.w-6,ey+en.h-5,3,leg?3:5);ctx.fillRect(ex+7,ey+en.h-4,2,leg?3:5);
  // glitch
  if(Math.sin(time*0.28+en.x*0.07)>0.80){
    ctx.fillStyle=`rgba(${t1?'255,0,80':'120,0,255'},0.35)`;ctx.fillRect(ex,ey+4,en.w,3);
  }
}

// ── PLAYER ────────────────────────────────────────────────────
function drawPlayer(p){
  if(p.invincible>0&&Math.floor(p.invincible/5)%2===0) return;
  const px=p.x|0,py=p.y|0,f=p.facing;
  const inAir=!p.grounded,moving=Math.abs(p.vx)>0.5,lp=p.anim;

  // shadow
  if(p.grounded){ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(px+1,py+p.h,p.w-2,2);}

  // ── legs ──
  ctx.fillStyle='#18222F';
  if(inAir){
    ctx.fillRect(px+3,py+16,4,5);ctx.fillRect(px+7,py+15,4,6);
  } else {
    const la=(lp===1||lp===3)?py+16:py+15;
    const ra=(lp===0||lp===2)?py+16:py+15;
    ctx.fillRect(px+3,la,4,p.h-(la-py));ctx.fillRect(px+7,ra,4,p.h-(ra-py));
  }
  // sneaker neon
  ctx.fillStyle='#00DD88';
  if(!inAir) ctx.fillRect(px+(f>0?7:3),py+p.h-1,5,1);

  // ── body ──
  ctx.fillStyle='#18222F';ctx.fillRect(px+2,py+9,p.w-4,11);
  ctx.fillStyle='#1E2C40';ctx.fillRect(px+3,py+10,p.w-6,9);
  // neon strips
  ctx.fillStyle='#00FFCC';ctx.fillRect(px+2,py+10,1,7);ctx.fillRect(px+p.w-3,py+10,1,7);
  // speed boost glow
  if(items.speed&&moving){
    ctx.fillStyle='rgba(255,200,0,0.12)';ctx.fillRect(px-2,py+8,p.w+4,p.h-8);
  }

  // ── hood ──
  ctx.fillStyle='#1A2638';ctx.fillRect(px+2,py+2,p.w-4,9);
  ctx.fillStyle='#222E45';ctx.fillRect(px+3,py+3,p.w-6,8);

  // ── arm ──
  ctx.fillStyle='#18222F';
  const armY=py+10+(moving&&!inAir&&lp%2?1:0);
  ctx.fillRect(f>0?px-1:px+p.w-1,inAir?py+7:armY,2,5);

  // ── backpack ──
  const bpX=f>0?px+1:px+p.w-3;
  ctx.fillStyle='#0A1520';ctx.fillRect(bpX,py+9,2,7);
  ctx.fillStyle=items.shield?'#FFDD57':'#388BFD';ctx.fillRect(bpX,py+10,2,1);
  if(items.double_jump){ctx.fillStyle='rgba(0,255,204,0.7)';ctx.fillRect(bpX,py+12,2,1);}

  // ── head / visor ──
  ctx.fillStyle='#111828';ctx.fillRect(px+3,py+2,7,8);
  ctx.fillStyle='#0099EE';ctx.fillRect(px+3,py+5,7,3);
  const vg=0.35+Math.sin(time*0.09+px*0.08)*0.25;
  ctx.fillStyle=`rgba(0,200,255,${vg})`;ctx.fillRect(px+3,py+5,7,1);
  ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillRect(px+4,py+6,2,1);
}

// ── HUD ───────────────────────────────────────────────────────
function drawHUD(){
  // dark panel
  ctx.fillStyle='rgba(2,6,18,0.82)';ctx.fillRect(0,0,GW,20);
  ctx.strokeStyle='rgba(0,255,204,0.15)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(GW,20);ctx.stroke();

  // HP bar
  ctx.fillStyle='rgba(15,28,50,0.9)';ctx.fillRect(4,3,5*14+2,12);
  ctx.strokeStyle='rgba(0,255,204,0.25)';ctx.strokeRect(4,3,5*14+2,12);
  const p=player;
  for(let i=0;i<5;i++){
    const filled=p&&i<p.energy;
    ctx.fillStyle=filled?(p.energy>3?'#3FB950':p.energy>1?'#D29922':'#DA3633'):'rgba(20,35,55,0.8)';
    ctx.fillRect(5+i*14,4,12,10);
  }
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='5px monospace';ctx.fillText('HP',6,11);

  // DATA
  ctx.fillStyle='rgba(15,28,50,0.9)';ctx.fillRect(78,3,58,12);
  ctx.strokeStyle='rgba(0,180,255,0.25)';ctx.strokeRect(78,3,58,12);
  ctx.fillStyle='#58A6FF';ctx.font='5px monospace';ctx.fillText('DADOS',80,11);
  ctx.fillStyle='#00FFCC';ctx.font='bold 6px monospace';ctx.fillText(`${dataCount}/${totalData}`,110,11);

  // ITEMS
  const itemList=[
    {key:'double_jump',label:'2xJMP',col:'#00FFCC'},
    {key:'speed',label:'VEL',col:'#FFDD57'},
    {key:'shield',label:'ESC',col:'#FF9944'},
  ];
  itemList.forEach((it,i)=>{
    const x=148+i*40,y=3;
    const active=items[it.key];
    ctx.fillStyle=active?`rgba(${it.col.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')},0.15)`:'rgba(15,28,50,0.6)';
    ctx.fillRect(x,y,36,12);
    ctx.strokeStyle=active?it.col:'rgba(40,60,90,0.5)';ctx.strokeRect(x,y,36,12);
    ctx.fillStyle=active?it.col:'rgba(60,80,110,0.6)';ctx.font='5px monospace';
    ctx.fillText(it.label,x+2,y+9);
  });

  // SCORE
  ctx.fillStyle='rgba(15,28,50,0.9)';ctx.fillRect(GW-60,3,56,12);
  ctx.strokeStyle='rgba(255,200,0,0.25)';ctx.strokeRect(GW-60,3,56,12);
  ctx.fillStyle='#FFDD57';ctx.font='5px monospace';ctx.fillText('PTS',GW-58,11);
  ctx.fillStyle='#FFFFFF';ctx.font='bold 6px monospace';ctx.fillText(String(score).padStart(5,'0'),GW-40,11);

  ctx.lineWidth=1;
}

// ── END ───────────────────────────────────────────────────────
function showEnd(win){
  const ov=document.getElementById('hrOverlay');
  ov.style.display='flex';
  if(win){
    if(typeof adicionarPontosJogo==='function') salvarResultadoJogo(score);
    if(true){
      /* handled by salvarResultadoJogo */
      /* handled by salvarResultadoJogo */
      if(true) { /* already saved */ };
    }
    ov.innerHTML=`<div style="text-align:center;padding:20px;">
      <div style="font-size:clamp(7px,1.2vw,10px);color:#3FB950;letter-spacing:3px;margin-bottom:4px;">MISSAO CONCLUIDA</div>
      <div style="font-size:clamp(20px,4.5vw,36px);font-weight:900;color:#00FFCC;letter-spacing:4px;text-shadow:0 0 20px #00FFCC88;margin-bottom:2px;">PC CENTRAL</div>
      <div style="font-size:clamp(7px,1.2vw,10px);color:#58A6FF;margin-bottom:12px;">DADOS: ${dataCount}/${totalData} &nbsp;|&nbsp; ITENS: ${Object.values(items).filter(Boolean).length}/3</div>
      <div style="font-size:clamp(30px,7vw,58px);font-weight:900;color:#FFF;text-shadow:0 0 10px #00FFCC55;margin-bottom:14px;">${score}<span style="font-size:0.35em;color:#8B949E;"> PTS</span></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button onclick="hrStart()" style="background:linear-gradient(135deg,#3FB950,#2A8C3A);color:#000;border:none;font-family:inherit;font-size:clamp(10px,2vw,13px);font-weight:900;padding:9px 24px;border-radius:4px;cursor:pointer;letter-spacing:1px;">JOGAR NOVAMENTE</button>
        <button onclick="voltarPlataforma()" style="background:rgba(20,35,55,0.9);color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(9px,1.5vw,11px);padding:9px 20px;border-radius:4px;cursor:pointer;">MENU</button>
      </div></div>`;
  } else {
    ov.innerHTML=`<div style="text-align:center;padding:20px;">
      <div style="font-size:clamp(7px,1.2vw,10px);color:#DA3633;letter-spacing:3px;margin-bottom:4px;">SISTEMA COMPROMETIDO</div>
      <div style="font-size:clamp(20px,4.5vw,36px);font-weight:900;color:#FF4444;letter-spacing:4px;text-shadow:0 0 20px #FF444488;margin-bottom:2px;">GAME OVER</div>
      <div style="font-size:clamp(7px,1.2vw,10px);color:#8B949E;margin-bottom:12px;">DADOS: ${dataCount}/${totalData} &nbsp;|&nbsp; ENERGIA ESGOTADA</div>
      <div style="font-size:clamp(30px,7vw,58px);font-weight:900;color:#FFF;margin-bottom:14px;">${score}<span style="font-size:0.35em;color:#8B949E;"> PTS</span></div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button onclick="hrStart()" style="background:linear-gradient(135deg,#DA3633,#991A18);color:#FFF;border:none;font-family:inherit;font-size:clamp(10px,2vw,13px);font-weight:900;padding:9px 24px;border-radius:4px;cursor:pointer;letter-spacing:1px;">TENTAR NOVAMENTE</button>
        <button onclick="voltarPlataforma()" style="background:rgba(20,35,55,0.9);color:#8B949E;border:1px solid #30363D;font-family:inherit;font-size:clamp(9px,1.5vw,11px);padding:9px 20px;border-radius:4px;cursor:pointer;">MENU</button>
      </div></div>`;
  }
}

// ── LOOP ──────────────────────────────────────────────────────
function loop(){
  if(!document.getElementById('hrCanvas')){animId=null;return;}
  animId=requestAnimationFrame(loop);
  if(gameState==='playing') update();
  render();
}




document.addEventListener('DOMContentLoaded', hrShowStart);
