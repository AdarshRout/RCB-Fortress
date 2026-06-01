/**
 * app.js — RCB Fortress Breaker
 * ─────────────────────────────────────────────────────────────────────
 * Grid : 8 columns × 16 rows = 128 bricks
 * Logic: Double-tap (300 ms) to shatter. 19-second game timer starts
 *        on the very first broken brick. Discount = Math.round((broken/128)*50).
 * Coupon: "RCB-MUNCH{discount}"
 */

'use strict';

/* ═══ CONSTANTS ═══════════════════════════════════════════════════════ */
const COLS       = 8;
const ROWS       = 16;
const TOTAL      = COLS * ROWS;       // 128
const GAME_TIME  = 19;                // seconds
const DBL_MS     = 300;               // double-tap window (ms)

/* ═══ HELPERS ═════════════════════════════════════════════════════════ */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ═══ ELEMENT REFS ════════════════════════════════════════════════════ */
const gridWall     = document.getElementById('grid-wall');
const logoOverlay  = document.getElementById('logo-overlay');
const hudBroken    = document.getElementById('hud-broken');
const hudTimer     = document.getElementById('hud-timer');
const progressBar  = document.getElementById('progress-bar');
const hintText     = document.getElementById('hint-text');
const modalOverlay = document.getElementById('modal-overlay');
const modalHeadline    = document.getElementById('modal-headline');
const modalTagline     = document.getElementById('modal-tagline');
const modalCouponCode  = document.getElementById('modal-coupon-code');
const modalDiscountNum = document.getElementById('modal-discount-num');
const modalStatsText   = document.getElementById('modal-stats-text');
const confettiCanvas   = document.getElementById('confetti-canvas');
const confettiCtx      = confettiCanvas.getContext('2d');
const introScreen      = document.getElementById('intro-screen');
const introBtn         = document.getElementById('intro-btn');

/* ═══ GAME STATE ══════════════════════════════════════════════════════ */
let brokenCount   = 0;
let timerLeft     = GAME_TIME;
let timerInterval = null;
let gameStarted   = false;
let gameOver      = false;
let discount      = 0;

/** Map<brickElement, { firstTapTime, resetTimeout }> */
const tapRegistry = new Map();

/* ═══ PARTICLE COLOURS ════════════════════════════════════════════════ */
const PARTICLE_COLORS = ['#CC0000', '#F5C518', '#ff6b35', '#ffffff', '#ff4081', '#ffcc00'];

/* ════════════════════════════════════════════════════════════════════
   INIT — called when user presses "PLAY BOLD"
   ════════════════════════════════════════════════════════════════════ */
function initGame() {
  /* ── Reset state ── */
  brokenCount   = 0;
  timerLeft     = GAME_TIME;
  gameStarted   = false;
  gameOver      = false;
  discount      = 0;
  tapRegistry.clear();

  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  /* ── Reset HUD ── */
  hudBroken.textContent = '0';
  hudTimer.textContent  = formatTime(GAME_TIME);
  hudTimer.classList.remove('danger');
  progressBar.style.width = '0%';
  hintText.classList.remove('hide');

  /* ── Reset modal ── */
  modalOverlay.classList.remove('visible');
  modalOverlay.setAttribute('aria-hidden', 'true');

  /* ── Reset logo overlay ── */
  logoOverlay.classList.remove('active');

  /* ── Stop confetti ── */
  stopConfetti();

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
  const brick = e.currentTarget;
  if (brick.classList.contains('shatter')) return;

  const now   = Date.now();
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

  /* Count & update HUD */
  brokenCount++;
  hudBroken.textContent = brokenCount;
  progressBar.style.width = `${(brokenCount / TOTAL) * 100}%`;

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
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const COUNT = 9;

  for (let i = 0; i < COUNT; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 / COUNT) * i;
    const dist  = 28 + Math.random() * 28;
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
    if (timerLeft <= 5) hudTimer.classList.add('danger');
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
  const pct     = Math.round((brokenCount / TOTAL) * 100);
  const elapsed = GAME_TIME - timerLeft;
  const coupon  = `RCB-MUNCH${discount}`;

  /* Dynamic headline & tagline */
  let headline, tagline;
  if      (discount === 0)  { headline = 'KEEP TRYING!';  tagline = "You'll smash it next time, Paltan!"; }
  else if (discount <  10)  { headline = 'NICE START!';   tagline = 'The fortress put up a fight!'; }
  else if (discount <  25)  { headline = 'WELL PLAYED!';  tagline = 'You dented the fortress!'; }
  else if (discount <  40)  { headline = 'PLAY BOLD!';    tagline = 'Ee Sala Cup Namde style!'; }
  else                      { headline = 'EE SALA! 🏆';  tagline = 'You destroyed the fortress!'; }

  modalHeadline.textContent    = headline;
  modalTagline.textContent     = tagline;
  modalCouponCode.textContent  = coupon;
  modalDiscountNum.textContent = discount;
  modalStatsText.innerHTML     =
    `Smashed <strong>${brokenCount}</strong> / <strong>${TOTAL}</strong> bricks `
    + `(<strong>${pct}%</strong>) in <strong>${elapsed}s</strong>`;

  /* Store coupon for copy button */
  document.getElementById('modal-copy-btn').dataset.coupon = coupon;
  document.getElementById('modal-copy-btn').textContent    = `🎉 Copy Code: ${coupon}`;

  /* Show modal */
  modalOverlay.classList.add('visible');
  modalOverlay.setAttribute('aria-hidden', 'false');

  /* Confetti for meaningful discounts */
  if (discount >= 10) launchConfetti();
}

/* ════════════════════════════════════════════════════════════════════
   COPY COUPON CODE
   ════════════════════════════════════════════════════════════════════ */
function copyCode() {
  const btn    = document.getElementById('modal-copy-btn');
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

introBtn.addEventListener('click', startGame);

/* ════════════════════════════════════════════════════════════════════
   CONFETTI ENGINE (Canvas-based, no deps)
   ════════════════════════════════════════════════════════════════════ */
let confettiRunning = false;
let confettiParts   = [];
let confettiRaf     = null;
const CONF_COLORS   = ['#CC0000','#F5C518','#ff6b35','#ffffff','#ff4081','#00e5ff','#ffcc00'];

function launchConfetti() {
  confettiCanvas.width  = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiParts   = [];
  confettiRunning = true;

  for (let i = 0; i < 130; i++) {
    confettiParts.push({
      x:     Math.random() * confettiCanvas.width,
      y:     Math.random() * confettiCanvas.height - confettiCanvas.height,
      w:     5 + Math.random() * 7,
      h:     3 + Math.random() * 4,
      color: CONF_COLORS[Math.floor(Math.random() * CONF_COLORS.length)],
      vx:    (Math.random() - 0.5) * 2.5,
      vy:    2.2 + Math.random() * 3.5,
      angle: Math.random() * 360,
      spin:  (Math.random() - 0.5) * 7,
      life:  1,
    });
  }
  tickConfetti();
}

function tickConfetti() {
  if (!confettiRunning) return;
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParts.forEach(p => {
    p.x     += p.vx;
    p.y     += p.vy;
    p.angle += p.spin;
    p.life  -= 0.0035;
    if (p.y > confettiCanvas.height) { p.y = -10; p.x = Math.random() * confettiCanvas.width; }
    confettiCtx.save();
    confettiCtx.globalAlpha = Math.max(0, p.life);
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.angle * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });

  confettiParts = confettiParts.filter(p => p.life > 0);
  if (confettiParts.length && confettiRunning) {
    confettiRaf = requestAnimationFrame(tickConfetti);
  } else {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiRunning = false;
  }
}

function stopConfetti() {
  confettiRunning = false;
  if (confettiRaf) { cancelAnimationFrame(confettiRaf); confettiRaf = null; }
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

/* ════════════════════════════════════════════════════════════════════
   MISC GUARDS
   ════════════════════════════════════════════════════════════════════ */

/* Prevent pinch-to-zoom on multi-touch */
document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });

/* Resize — keep confetti canvas in sync */
window.addEventListener('resize', () => {
  if (confettiRunning) {
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
});
