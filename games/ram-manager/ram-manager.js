'use strict';
// ── RAM Manager — standalone game ────────────────────────────

function voltarPlataforma() {
  window.location.href = '../../index.html';
}

function lerAlunoId() {
  return new URLSearchParams(window.location.search).get('alunoId') || '';
}

function salvarResultadoJogo(pts) {
  const result = {
    alunoId: lerAlunoId(),
    gameId: 'ram-manager',
    moduloId: new URLSearchParams(window.location.search).get('moduloId') || 'memoria',
    status: 'completed',
    score: pts,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('lusca_pending_game_result', JSON.stringify(result));
}

// =============================================================
// GERENCIADOR DE RAM — Arcade Survival
// =============================================================
const RAM_TOTAL = 8192; // MB
const RAM_SLOTS = 16;
const RAM_PROC_NAMES = [
  'chrome.exe','firefox.exe','steam.exe','discord.exe','explorer.exe',
  'photoshop.exe','vlc.exe','spotify.exe','obs.exe','vscode.exe',
  'word.exe','excel.exe','teams.exe','zoom.exe','minecraft.exe',
  'outlook.exe','skype.exe','winrar.exe','torrent.exe','cmd.exe',
  'notepad.exe','paint.exe','powershell.exe','taskhost.exe','svchost.exe',
];
const RAM_VIRUS_NAMES = [
  'trojan.exe','keylogger.exe','worm.bat','adware.exe','ransomware.exe',
  'spyware.exe','rootkit.sys','malware.exe','backdoor.exe','botnet.exe',
];

let ramArcState = null;
let ramArcLoop = null;
let ramArcSpawnTimer = null;

function ramFmt(mb) {
  return mb >= 1024 ? (mb/1024).toFixed(1)+' GB' : mb+' MB';
}

function iniciarRamGame() {
  clearInterval(ramArcLoop);
  clearTimeout(ramArcSpawnTimer);
  ramArcState = {
    slots: Array.from({length: RAM_SLOTS}, () => null),
    usedMb: 0,
    pontos: 0,
    wave: 1,
    morto: false,
    tick: 0,
    nextPid: 1,
  };
  /* standalone */;
  _ramBuildUI();
  _ramStartLoop();
  _ramScheduleSpawn();
}

function _ramBuildUI() {
  const el = document.getElementById('ramGameContent');
  const slotsHtml = ramArcState.slots.map((_,i) =>
    `<div class="ram-slot empty" id="ramSlot${i}"></div>`
  ).join('');
  el.innerHTML = `
    <div class="ram-arcade-wrap" id="ramArcWrap">
      <div class="ram-hud">
        <div class="ram-hud-bar-wrap">
          <div class="ram-hud-bar-label">
            <span>RAM USO</span>
            <span id="ramHudPct">0%</span>
          </div>
          <div class="ram-hud-bar-track">
            <div class="ram-hud-bar-fill" id="ramHudBar" style="width:0%"></div>
          </div>
          <div style="font-size:10px;color:#8B949E;margin-top:2px;" id="ramHudMb">0 MB / 8.0 GB</div>
        </div>
        <div class="ram-hud-stat">
          <div class="ram-hud-stat-val" id="ramHudPontos">0</div>
          <div class="ram-hud-stat-lbl">PONTOS</div>
        </div>
        <div class="ram-hud-stat">
          <div class="ram-hud-stat-val" id="ramHudWave">1</div>
          <div class="ram-hud-stat-lbl">WAVE</div>
        </div>
        <button onclick="voltarPlataforma()" style="background:#21262D;border:1px solid #30363D;color:#8B949E;font-family:inherit;font-size:12px;padding:6px 12px;border-radius:6px;cursor:pointer;">SAIR</button>
      </div>
      <div class="ram-slots" id="ramSlotsGrid">${slotsHtml}</div>
    </div>
  `;
}

function _ramStartLoop() {
  ramArcLoop = setInterval(() => {
    if (!ramArcState || ramArcState.morto) return;
    ramArcState.tick++;

    // Wave progression every 20 seconds (200 ticks at 100ms)
    const newWave = Math.floor(ramArcState.tick / 200) + 1;
    if (newWave > ramArcState.wave) {
      ramArcState.wave = newWave;
      _ramShowWaveToast(newWave);
      document.getElementById('ramHudWave').textContent = newWave;
    }

    // Each active process consumes more RAM per tick as wave increases
    let totalUsed = 0;
    const speedMult = 1 + (ramArcState.wave - 1) * 0.3;
    ramArcState.slots.forEach((proc, i) => {
      if (!proc) return;
      const drainRate = proc.isVirus ? 0.8 * speedMult : 0.3 * speedMult;
      proc.fill = Math.min(100, proc.fill + drainRate);
      totalUsed += proc.mb * (proc.fill / 100);
      _ramUpdateSlotBar(i, proc);
    });

    ramArcState.usedMb = Math.round(totalUsed);
    const pct = Math.min(100, (ramArcState.usedMb / RAM_TOTAL) * 100);

    // Update HUD
    const bar = document.getElementById('ramHudBar');
    const pctEl = document.getElementById('ramHudPct');
    const mbEl = document.getElementById('ramHudMb');
    if (bar) {
      bar.style.width = pct + '%';
      bar.className = 'ram-hud-bar-fill' + (pct >= 90 ? ' crit' : pct >= 65 ? ' warn' : '');
    }
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (mbEl) mbEl.textContent = `${ramFmt(ramArcState.usedMb)} / ${ramFmt(RAM_TOTAL)}`;

    if (pct >= 100) _ramGameOver();
  }, 100);
}

function _ramScheduleSpawn() {
  if (!ramArcState || ramArcState.morto) return;
  const wave = ramArcState.wave || 1;
  const baseDelay = Math.max(800, 2500 - wave * 180);
  const delay = baseDelay * (0.7 + Math.random() * 0.6);
  ramArcSpawnTimer = setTimeout(() => {
    if (!ramArcState || ramArcState.morto) return;
    _ramSpawnProcess();
    _ramScheduleSpawn();
  }, delay);
}

function _ramSpawnProcess() {
  const freeSlots = ramArcState.slots.map((v,i) => v===null ? i : -1).filter(i=>i>=0);
  if (freeSlots.length === 0) return;
  const slotIdx = freeSlots[Math.floor(Math.random() * freeSlots.length)];
  const wave = ramArcState.wave;
  const isVirus = Math.random() < Math.min(0.35, 0.05 + wave * 0.04);
  const names = isVirus ? RAM_VIRUS_NAMES : RAM_PROC_NAMES;
  const name = names[Math.floor(Math.random() * names.length)];
  const mbBase = isVirus ? [512, 1024, 2048] : [128, 256, 512, 768, 1024];
  const mb = mbBase[Math.floor(Math.random() * mbBase.length)];

  const proc = {
    pid: ramArcState.nextPid++,
    name,
    mb,
    isVirus,
    fill: 0,
  };
  ramArcState.slots[slotIdx] = proc;
  _ramRenderSlot(slotIdx, proc);
}

function _ramRenderSlot(i, proc) {
  const el = document.getElementById('ramSlot' + i);
  if (!el) return;
  el.className = 'ram-slot active' + (proc.isVirus ? ' virus' : '');
  el.onclick = () => _ramKillProcess(i);
  el.innerHTML = `
    <div class="ram-slot-pid">PID ${proc.pid}</div>
    <div class="ram-slot-name" title="${proc.name}">${proc.name}</div>
    <div class="ram-slot-mb">${ramFmt(proc.mb)}</div>
    <div class="ram-slot-bar-track"><div class="ram-slot-bar-fill" id="ramSlotBar${i}" style="width:${proc.fill}%"></div></div>
    <div class="ram-slot-type">${proc.isVirus ? 'VIRUS' : 'PROC'}</div>
  `;
}

function _ramUpdateSlotBar(i, proc) {
  const bar = document.getElementById('ramSlotBar' + i);
  if (bar) bar.style.width = proc.fill + '%';
}

function _ramKillProcess(i) {
  if (!ramArcState || ramArcState.morto) return;
  const proc = ramArcState.slots[i];
  if (!proc) return;
  const el = document.getElementById('ramSlot' + i);
  if (el) {
    el.classList.add('killing');
    el.onclick = null;
  }
  const pts = proc.isVirus ? 30 : 10;
  ramArcState.pontos += pts;
  document.getElementById('ramHudPontos').textContent = ramArcState.pontos;

  setTimeout(() => {
    ramArcState.slots[i] = null;
    const slotEl = document.getElementById('ramSlot' + i);
    if (slotEl) {
      slotEl.className = 'ram-slot empty';
      slotEl.innerHTML = '';
      slotEl.onclick = null;
    }
    // Virus spawns an extra process when killed
    if (proc.isVirus) {
      setTimeout(() => _ramSpawnProcess(), 300);
    }
  }, 200);
}

function _ramShowWaveToast(wave) {
  const old = document.getElementById('ramWaveToast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'ramWaveToast';
  el.className = 'ram-wave-toast';
  el.textContent = `WAVE ${wave}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function _ramGameOver() {
  if (!ramArcState || ramArcState.morto) return;
  ramArcState.morto = true;
  clearInterval(ramArcLoop);
  clearTimeout(ramArcSpawnTimer);

  const wrap = document.getElementById('ramArcWrap');
  if (!wrap) return;
  wrap.style.position = 'relative';
  const overlay = document.createElement('div');
  overlay.className = 'ram-gameover-overlay';
  overlay.innerHTML = `
    <div class="ram-go-title">RAM CHEIA</div>
    <div class="ram-go-sub">O sistema travou na wave ${ramArcState.wave}</div>
    <div class="ram-go-score">${ramArcState.pontos} pts</div>
    <div class="ram-go-btns">
      <button class="ram-go-btn" onclick="iniciarRamGame()">REINICIAR</button>
      <button class="ram-go-btn secondary" onclick="voltarPlataforma()">SAIR</button>
    </div>
  `;
  wrap.appendChild(overlay);
  salvarResultadoJogo(ramArcState.pontos);
}

function reiniciarRamGame() { iniciarRamGame(); }

document.addEventListener('DOMContentLoaded', iniciarRamGame);
