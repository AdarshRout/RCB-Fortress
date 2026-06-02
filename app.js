/**
 * app.js — RCB BLINKBREAKS
 * ─────────────────────────────────────────────────────────────────────
 * Grid : 8 columns × 16 rows = 128 bricks
 * Logic: Double-tap (300 ms) to shatter. 19-second game timer starts
 *        on the very first broken brick. Discount = Math.round((broken/128)*50).
 * Coupon: "RCB-MUNCH{discount}"
 */

'use strict';

/* ═══ AUDIO SYSTEM ════════════════════════════════════════════════════ */
let isMuted = false;

// Preload URLs for maximum stability and fallback capability
const AUDIO_URLS = {
  shatter: 'https://assets.mixkit.co/active_storage/sfx/1657/1657-84.wav', // Sharp wood/glass break
  combo: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav',   // High-pitched success ding
  warning: 'https://assets.mixkit.co/active_storage/sfx/2290/2290-84.wav', // Clock tick / alert beep
  win: 'https://assets.mixkit.co/active_storage/sfx/2021/2021-84.wav',     // Stadium cheering
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav'     // Clean UI click
};

// Initialize audio objects
const audioInstances = {};

// Audio pooling for shattering to allow super rapid successive playback
const SHATTER_POOL_SIZE = 4;
const shatterPool = [];
let shatterPoolIndex = 0;

// Initialize instances right away
try {
  for (const [key, url] of Object.entries(AUDIO_URLS)) {
    if (key !== 'shatter') {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioInstances[key] = audio;
    }
  }

  for (let i = 0; i < SHATTER_POOL_SIZE; i++) {
    const audio = new Audio(AUDIO_URLS.shatter);
    audio.preload = 'auto';
    shatterPool.push(audio);
  }
} catch (e) {
  console.warn("HTML5 Audio preload failed:", e);
}

// Incredibly advanced Web Audio synthesis engine for offline/fallback stability!
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynthFallback(key) {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    if (key === 'shatter') {
      // Synthesize a sharp willow wood crack sound (high bandpass / oscillator decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (key === 'combo') {
      // Synthesize high-pitched arcade double ding
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.08); // E5
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);
    } else if (key === 'warning') {
      // Ticking alert sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (key === 'win') {
      // Celebratory major chord arpeggio/fanfare!
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } else if (key === 'click') {
      // Standard snap UI click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (e) {
    console.warn("Web Audio synthesis failed/blocked:", e);
  }
}

// Master play function with robust volume controls and error guards
function playSound(key) {
  if (isMuted) return;

  try {
    if (key === 'shatter') {
      // Rotate through pooled instances for zero-delay overlapping
      const audio = shatterPool[shatterPoolIndex];
      if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => playSynthFallback(key));
        }
      } else {
        playSynthFallback(key);
      }
      shatterPoolIndex = (shatterPoolIndex + 1) % SHATTER_POOL_SIZE;
    } else {
      const audio = audioInstances[key];
      if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => playSynthFallback(key));
        }
      } else {
        playSynthFallback(key);
      }
    }
  } catch (err) {
    playSynthFallback(key);
  }
}

/* ═══ CONSTANTS ═══════════════════════════════════════════════════════ */
const COLS = 8;
const ROWS = 16;
const TOTAL = COLS * ROWS;       // 128
const GAME_TIME = 19;                // seconds
const DBL_MS = 300;               // double-tap window (ms)

/* ═══ HELPERS ═════════════════════════════════════════════════════════ */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ═══ ELEMENT REFS ════════════════════════════════════════════════════ */
const gridWall = document.getElementById('grid-wall');
const logoOverlay = document.getElementById('logo-overlay');
const hudBroken = document.getElementById('hud-broken');
const hudTimer = document.getElementById('hud-timer');
const progressBar = document.getElementById('progress-bar');
const hintText = document.getElementById('hint-text');
const modalOverlay = document.getElementById('modal-overlay');
const modalHeadline = document.getElementById('modal-headline');
const modalTagline = document.getElementById('modal-tagline');
const modalCouponCode = document.getElementById('modal-coupon-code');
const modalDiscountNum = document.getElementById('modal-discount-num');
const modalStatsText = document.getElementById('modal-stats-text');
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const introScreen = document.getElementById('intro-screen');
const introBtn = document.getElementById('intro-btn');

/* ═══ GAME STATE ══════════════════════════════════════════════════════ */
let brokenCount = 0;
let timerLeft = GAME_TIME;
let timerInterval = null;
let gameStarted = false;
let gameOver = false;
let discount = 0;

/** Map<brickElement, { firstTapTime, resetTimeout }> */
const tapRegistry = new Map();

/* ═══ PARTICLE COLOURS ════════════════════════════════════════════════ */
const PARTICLE_COLORS = ['#CC0000', '#F5C518', '#ff6b35', '#ffffff', '#ff4081', '#ffcc00'];

/* ════════════════════════════════════════════════════════════════════
   INIT — called when user presses "PLAY BOLD"
   ════════════════════════════════════════════════════════════════════ */
function initGame() {
  /* ── Reset state ── */
  brokenCount = 0;
  timerLeft = GAME_TIME;
  gameStarted = false;
  gameOver = false;
  discount = 0;
  tapRegistry.clear();

  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  /* ── Reset HUD ── */
  hudBroken.textContent = '0';
  hudTimer.textContent = formatTime(GAME_TIME);
  hudTimer.classList.remove('danger');
  progressBar.style.width = '0%';
  hintText.classList.remove('hide');

  /* ── Reset modal ── */
  modalOverlay.classList.remove('visible');
  modalOverlay.setAttribute('aria-hidden', 'true');

  /* ── Reset logo overlay ── */
  logoOverlay.classList.remove('active');

  /* ── Stop custom fireworks ── */
  stopCustomFireworks();

  /* ── Build the 128 bricks ── */
  buildGrid();
}

/* ════════════════════════════════════════════════════════════════════
   BUILD GRID — create 128 brick divs and attach interaction handlers
   ════════════════════════════════════════════════════════════════════ */
function buildGrid() {
  gridWall.innerHTML = '';
  gridWall.style.display = 'grid';

  for (let i = 0; i < TOTAL; i++) {
    const brick = document.createElement('div');
    brick.className = 'brick';
    brick.setAttribute('role', 'button');
    brick.setAttribute('aria-label', `Brick ${i + 1}`);
    brick.dataset.idx = i;

    /* ── Double-tap via touchstart (mobile) ── */
    brick.addEventListener('touchstart', handleTouchStart, { passive: true });

    /* ── dblclick fallback (desktop/mouse) ── */
    brick.addEventListener('dblclick', handleDblClick);

    gridWall.appendChild(brick);
  }
}

/* ════════════════════════════════════════════════════════════════════
   INTERACTION HANDLERS
   ════════════════════════════════════════════════════════════════════ */

/**
 * touchstart — custom 300 ms double-tap detector.
 * First tap: record timestamp + set a reset timeout.
 * Second tap within DBL_MS: treat as confirmed double-tap → shatter.
 */
function handleTouchStart(e) {
  if (gameOver) return;
  try {
    getAudioContext().resume();
  } catch (err) {}
  const brick = e.currentTarget;
  if (brick.classList.contains('shatter')) return;

  const now = Date.now();
  const state = tapRegistry.get(brick);

  if (state && (now - state.firstTapTime) <= DBL_MS) {
    /* ── CONFIRMED DOUBLE-TAP ── */
    clearTimeout(state.resetTimeout);
    tapRegistry.delete(brick);
    brick.classList.remove('cracked');
    triggerShatter(brick);
  } else {
    /* ── FIRST TAP ── */
    if (state) clearTimeout(state.resetTimeout);
    brick.classList.add('cracked');

    const resetTimeout = setTimeout(() => {
      brick.classList.remove('cracked');
      tapRegistry.delete(brick);
    }, DBL_MS);

    tapRegistry.set(brick, { firstTapTime: now, resetTimeout });
  }
}

/**
 * dblclick — fires natively on mouse double-click; used as desktop fallback.
 */
function handleDblClick(e) {
  if (gameOver) return;
  try {
    getAudioContext().resume();
  } catch (err) {}
  const brick = e.currentTarget;
  if (brick.classList.contains('shatter')) return;

  /* Clean up any pending tap state */
  const state = tapRegistry.get(brick);
  if (state) { clearTimeout(state.resetTimeout); tapRegistry.delete(brick); }

  brick.classList.remove('cracked');
  triggerShatter(brick);
}

/* ════════════════════════════════════════════════════════════════════
   SHATTER BRICK
   ════════════════════════════════════════════════════════════════════ */
function triggerShatter(brick) {
  /* Start game timer on the very first broken brick */
  if (!gameStarted) {
    gameStarted = true;
    hintText.classList.add('hide');
    startCountdown();
  }

  /* Apply shatter CSS (scale:0, opacity:0, 0.3 s transition) */
  brick.classList.add('shatter');
  
  /* Play sharp shatter sound effect */
  playSound('shatter');

  /* Count & update HUD */
  brokenCount++;
  hudBroken.textContent = brokenCount;
  progressBar.style.width = `${(brokenCount / TOTAL) * 100}%`;

  /* Play combo sound every 5 bricks broke */
  if (brokenCount % 5 === 0) {
    playSound('combo');
  }

  /* Spawn trophy — animates translateY upward then fades out */
  spawnTrophy(brick);

  /* Particle burst at brick centre */
  spawnParticles(brick);

  /* Check win condition */
  if (brokenCount >= TOTAL) endGame();
}

/* ════════════════════════════════════════════════════════════════════
   TROPHY REWARD
   Spawned as absolute child of shattered brick; drops downward via CSS.
   ════════════════════════════════════════════════════════════════════ */
function spawnTrophy(brick) {
  const trophy = document.createElement('div');
  trophy.className = 'trophy-drop';
  brick.appendChild(trophy);
  /* Remove after animation completes (0.4 s + buffer) */
  setTimeout(() => trophy.remove(), 500);
}

/* ════════════════════════════════════════════════════════════════════
   PARTICLE BURST
   ════════════════════════════════════════════════════════════════════ */
function spawnParticles(brick) {
  const rect = brick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const COUNT = 9;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 / COUNT) * i;
    const dist = 28 + Math.random() * 28;
    p.style.cssText = `
      left: ${cx}px;
      top:  ${cy}px;
      background: ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]};
      --pdx: ${(Math.cos(angle) * dist).toFixed(1)}px;
      --pdy: ${(Math.sin(angle) * dist).toFixed(1)}px;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 550);
  }
}

/* ════════════════════════════════════════════════════════════════════
   GAME COUNTDOWN — 19 seconds, fires on first break
   ════════════════════════════════════════════════════════════════════ */
function startCountdown() {
  timerInterval = setInterval(() => {
    timerLeft--;
    hudTimer.textContent = formatTime(timerLeft);
    if (timerLeft <= 5) {
      hudTimer.classList.add('danger');
      if (timerLeft > 0) {
        playSound('warning');
      }
    }
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      endGame();
    }
  }, 1000);
}

/* ════════════════════════════════════════════════════════════════════
   END GAME
   ════════════════════════════════════════════════════════════════════ */
function endGame() {
  if (gameOver) return;
  gameOver = true;

  /* ── 1. Clear game timer ── */
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  /* ── 2. Hide the grid wall ── */
  gridWall.style.display = 'none';

  /* ── Calculate discount ── */
  discount = Math.round((brokenCount / TOTAL) * 50);

  /* ── 3. Show logo overlay (spawns popIn animation + rotating rays) ── */
  logoOverlay.classList.add('active');

  /* ── 4. Hold for 2.5 seconds, then transition to results modal ── */
  setTimeout(() => {
    /* Fade out the logo overlay */
    logoOverlay.classList.remove('active');

    /* Immediately show result modal after fade-out transition completes (500ms) */
    setTimeout(showResultModal, 500);
  }, 2500);
}

/* ════════════════════════════════════════════════════════════════════
   RESULT MODAL
   ════════════════════════════════════════════════════════════════════ */
function showResultModal() {
  const pct = Math.round((brokenCount / TOTAL) * 100);
  const elapsed = GAME_TIME - timerLeft;
  const coupon = `RCB-CUP-${discount}`;

  /* Dynamic headline & tagline */
  let headline, tagline;
  if (discount === 0) { headline = 'KEEP TRYING!'; tagline = "RCB holds the record for the highest team total in IPL history, smashing a legendary 263/5 against Pune Warriors India back in 2013."; }
  else if (discount < 10) { headline = 'NICE START!'; tagline = "The highest team score in IPL playoffs history is 254/5, set by Royal Challengers Bengaluru against the Gujarat Titans during the 2026 Qualifier 1."; }
  else if (discount < 25) { headline = 'WELL PLAYED!'; tagline = 'RCB is the only team to retain a player throughout the IPL history.'; }
  else if (discount < 40) { headline = 'PLAY BOLD!'; tagline = 'RCB holds the highest individual score in T20 cricket history (175*) and the highest partnership by runs (229) in the IPL.'; }
  else { 
    headline = 'EE SALA! 🏆'; 
    tagline = 'EE SALA CUP 🏆 NAMDU x2 !!'; 
    playSound('win');
  }

  modalHeadline.textContent = headline;
  modalTagline.textContent = tagline;
  modalCouponCode.textContent = coupon;
  modalDiscountNum.textContent = discount;
  modalStatsText.innerHTML =
    `BLINKBROKE <strong>${brokenCount}</strong> bricks in <strong>${elapsed}s</strong>`;

  /* Store coupon for copy button */
  document.getElementById('modal-copy-btn').dataset.coupon = coupon;
  document.getElementById('modal-copy-btn').textContent = `🎉 Copy Code: ${coupon}`;

  /* Show modal */
  modalOverlay.classList.add('visible');
  modalOverlay.setAttribute('aria-hidden', 'false');

  /* Continuous gorgeous fireworks throughout the screen */
  startCustomFireworks();
}

/* ════════════════════════════════════════════════════════════════════
   COPY COUPON CODE
   ════════════════════════════════════════════════════════════════════ */
function copyCode() {
  playSound('click');
  const btn = document.getElementById('modal-copy-btn');
  const coupon = btn.dataset.coupon;
  if (!coupon) return;

  const orig = btn.textContent;
  navigator.clipboard.writeText(coupon)
    .then(() => {
      btn.textContent = '✅ Copied to Clipboard!';
      setTimeout(() => { btn.textContent = orig; }, 2200);
    })
    .catch(() => {
      btn.textContent = `📋 ${coupon}`;
      setTimeout(() => { btn.textContent = orig; }, 2200);
    });
}

/* ════════════════════════════════════════════════════════════════════
   RETRY
   ════════════════════════════════════════════════════════════════════ */
function retryGame() {
  initGame();
}

/* ════════════════════════════════════════════════════════════════════
   INTRO → GAME TRANSITION
   ════════════════════════════════════════════════════════════════════ */
function startGame() {
  introScreen.classList.add('hide');
  setTimeout(() => { introScreen.style.display = 'none'; }, 480);
  initGame();
}

introBtn.addEventListener('click', () => {
  playSound('click');
  try {
    getAudioContext().resume();
  } catch (e) {}
  startGame();
});

// Setup Global Mute Toggle Button
const muteBtn = document.getElementById('mute-toggle');
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
    muteBtn.classList.toggle('muted', isMuted);
    
    // Resume context on toggle interaction just in case
    try {
      getAudioContext().resume();
    } catch (e) {}
    
    playSound('click');
  });
}

/* ════════════════════════════════════════════════════════════════════
   PRELOADER LIFECYCLE
   Builds the grid in background while preloader is visible.
   After 2.5 s the overlay fades out, revealing the game.
   ════════════════════════════════════════════════════════════════════ */
const preloader = document.getElementById('preloader');

window.addEventListener('load', () => {
  /* Build grid silently while preloader is on screen */
  buildGrid();

  setTimeout(() => {
    preloader.classList.add('fade-out');
    /* Remove from DOM after transition ends (500 ms) */
    setTimeout(() => preloader.remove(), 500);
  }, 2500);
});

/* ════════════════════════════════════════════════════════════════════
   FIREWORKS ENGINE (Canvas-based, no deps, continuous beautiful bursts)
   ════════════════════════════════════════════════════════════════════ */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.8 + Math.random() * 4.2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color = color;
    this.alpha = 1.0;
    this.decay = 0.012 + Math.random() * 0.012;
    this.gravity = 0.06;
    this.size = 2.0 + Math.random() * 2.0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

class Firework {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = height;
    this.targetY = height * 0.15 + Math.random() * (height * 0.45);
    this.speed = 6 + Math.random() * 5;
    const palette = ['#FFD700', '#FF3333', '#ECFF20'];
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.radius = 3;
    this.exploded = false;
  }

  update() {
    this.y -= this.speed;
    if (this.y <= this.targetY) {
      this.exploded = true;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

let customFireworksActive = false;
let customRockets = [];
let customParticles = [];
let customFireworksRaf = null;
let customFireworksInterval = null;

function startCustomFireworks() {
  const modalOverlay = document.getElementById('modal-overlay');
  if (!modalOverlay) return;

  let canvas = document.getElementById('fireworks-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    modalOverlay.insertBefore(canvas, modalOverlay.firstChild);
  }

  const container = document.getElementById('game-shell') || document.querySelector('.game-container');
  if (container) {
    const rect = container.getBoundingClientRect();
    canvas.style.position = 'absolute';
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  const ctx = canvas.getContext('2d');
  customRockets = [];
  customParticles = [];
  customFireworksActive = true;

  function tick() {
    if (!customFireworksActive) return;

    // smooth cinematic trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update & Draw Rockets
    for (let i = customRockets.length - 1; i >= 0; i--) {
      const r = customRockets[i];
      r.update();
      r.draw(ctx);
      if (r.exploded) {
        const count = 40 + Math.floor(Math.random() * 21); // 40-60 particles
        for (let j = 0; j < count; j++) {
          customParticles.push(new Particle(r.x, r.y, r.color));
        }
        customRockets.splice(i, 1);
      }
    }

    // Update & Draw Particles
    for (let i = customParticles.length - 1; i >= 0; i--) {
      const p = customParticles[i];
      p.update();
      if (p.alpha <= 0) {
        customParticles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    customFireworksRaf = requestAnimationFrame(tick);
  }

  tick();

  // Auto-spawn rockets every 400ms
  if (customFireworksInterval) clearInterval(customFireworksInterval);
  customFireworksInterval = setInterval(() => {
    if (customFireworksActive) {
      customRockets.push(new Firework(canvas.width, canvas.height));
    }
  }, 400);
}

function stopCustomFireworks() {
  customFireworksActive = false;
  if (customFireworksRaf) {
    cancelAnimationFrame(customFireworksRaf);
    customFireworksRaf = null;
  }
  if (customFireworksInterval) {
    clearInterval(customFireworksInterval);
    customFireworksInterval = null;
  }
  const canvas = document.getElementById('fireworks-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ════════════════════════════════════════════════════════════════════
   MISC GUARDS
   ════════════════════════════════════════════════════════════════════ */

/* Prevent pinch-to-zoom on multi-touch */
document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });

/* Resize — keep custom fireworks canvas in sync */
window.addEventListener('resize', () => {
  const canvas = document.getElementById('fireworks-canvas');
  const container = document.getElementById('game-shell') || document.querySelector('.game-container');
  if (canvas && container) {
    const rect = container.getBoundingClientRect();
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
});
