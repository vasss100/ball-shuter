// =========================================================================
// 1. GLOBAL CONFIGURATION & EXACT ASSET PATHS
// =========================================================================
const CONFIG = {
  COLS: 8,
  ROWS: 14,
  INITIAL_ROWS: 5,
  SHOOT_SPEED: 16,
  POP_SCORE: 10,
  FLOAT_SCORE: 25,
  SHOTS_PER_ROW: 7,
  NUM_COLORS: 5,
  COLOR_SPECIAL: 5,
  COLOR_AIR: 6,
  SPECIAL_CHANCE: 0.12,
  AIR_CHANCE: 0.08,
  MAX_PARTICLES: 300,
  IMAGE_PATH: 'asets/new image/',
  BUBBLE_COLORS: [
    { name: 'blue',   file: 'blue boll.png' },
    { name: 'green',  file: 'green boll.png' },
    { name: 'purple', file: 'pulpul boll.png' },
    { name: 'red',    file: 'red boll.png' },
    { name: 'yellow', file: 'yelloboll.png' },
  ],
  BUBBLE_SPECIAL: { name: 'colorful', file: 'colorfull boll.png' },
  BUBBLE_AIR:     { name: 'air',      file: 'Gemini_Generated_Image_a76ulba76ulba76u.png' },
  UI: {
    premiumPlay: 'Gemini_Generated_Image_k3tv0xk3tv0xk3tv.png',
    back: 'back.png',
    pause: 'puss .png', 
    play: 'play.png',
  },
};

const BUBBLE_FALLBACK_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#34D399', '#F97316', '#FFFFFF'];

// =========================================================================
// 2. BULLETPROOF IMAGE LOADER SYSTEM
// =========================================================================
class ImageLoader {
  constructor() {
    this.images = {};
    this.total = 0;
    this.loaded = 0;
  }

  add(key, path) {
    this.total++;
    const img = new Image();
    img.onload = () => { this.loaded++; this.updateUI(); };
    img.onerror = () => {
      console.warn(`Asset fallback triggered for: ${path}`);
      this.loaded++;
      this.updateUI();
    };
    img.src = path;
    this.images[key] = img;
  }

  updateUI() {
    const txt = document.getElementById('loadingText');
    if (txt) {
      const pct = Math.round((this.loaded / this.total) * 100);
      txt.innerText = `Loading ${pct}%`;
    }
  }

  get done() { return this.loaded >= this.total; }
}

// =========================================================================
// 3. CORE GAME MODULES (BOARD & SHOOTER LOGIC)
// =========================================================================
class Board {
  constructor() {
    this.grid = [];
    this.bubbleRadius = 20;
    this.hexW = 34; this.hexH = 40;
    this.offsetX = 0; this.offsetY = 0;
    this.cols = CONFIG.COLS; this.rows = CONFIG.ROWS;
  }

  configure(canvasW, canvasH, topH) {
    const padding = canvasW * 0.04;
    const availW = canvasW - padding * 2;
    this.bubbleRadius = availW / (this.cols * Math.sqrt(3) + Math.sqrt(3) / 2);
    const maxR = ((canvasH - topH - 20) * 0.72) / (this.rows * 1.5);
    if (this.bubbleRadius > maxR) this.bubbleRadius = maxR;
    this.hexW = Math.sqrt(3) * this.bubbleRadius;
    this.hexH = 2 * this.bubbleRadius;
    this.offsetX = (canvasW - this.cols * this.hexW) / 2;
    this.offsetY = topH + 10 + this.bubbleRadius * 1.5;
  }

  clearGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) this.grid[r][c] = null;
    }
  }

  generateInitial() {
    this.clearGrid();
    for (let r = 0; r < CONFIG.INITIAL_ROWS; r++) {
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = Math.floor(Math.random() * CONFIG.NUM_COLORS);
      }
    }
  }

  getHexPos(row, col) {
    const odd = row % 2;
    return {
      x: this.offsetX + (odd ? this.hexW : this.hexW / 2) + col * this.hexW,
      y: this.offsetY + row * this.hexH * 0.75,
    };
  }

  getNeighbors(row, col) {
    const nb = []; const odd = row % 2;
    const offsets = odd ? 
      [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]] : 
      [[0, -1], [0, 1], [-1, -1], [1, -1], [-1, 0], [1, 0]];
    for (const [dr, dc] of offsets) {
      const nr = row + dr, nc = col + dc;
      const maxC = (nr % 2 === 1) ? this.cols - 1 : this.cols;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < maxC) nb.push([nr, nc]);
    }
    return nb;
  }

  checkGameOver() {
    const maxC = ((this.rows - 1) % 2 === 1) ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC; c++) {
      if (this.grid[this.rows - 1][c] !== null && this.grid[this.rows - 1][c] !== undefined) return true;
    }
    return false;
  }

  shiftDown() {
    for (let r = this.rows - 1; r > 0; r--) {
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        const prevMaxC = ((r - 1) % 2 === 1) ? this.cols - 1 : this.cols;
        if (c < prevMaxC) this.grid[r][c] = this.grid[r - 1][c];
        else this.grid[r][c] = null;
      }
    }
    const maxC0 = (0 % 2 === 1) ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC0; c++) this.grid[0][c] = Math.floor(Math.random() * CONFIG.NUM_COLORS);
  }
}

class Shooter {
  constructor(x, y, bubbleR) {
    this.x = x; this.y = y; this.bubbleR = bubbleR;
    this.angle = -Math.PI / 2;
    this.current = null; this.next = null;
  }

  refill() {
    this.current = this.next !== null ? this.next : Math.floor(Math.random() * CONFIG.NUM_COLORS);
    this.next = Math.floor(Math.random() * CONFIG.NUM_COLORS);
  }

  getTipPosition() {
    return {
      x: this.x + Math.cos(this.angle) * this.bubbleR * 1.8,
      y: this.y + Math.sin(this.angle) * this.bubbleR * 1.8,
    };
  }

  calculateTrajectory(canvasW, board) {
    const tip = this.getTipPosition();
    let x = tip.x, y = tip.y;
    let dx = Math.cos(this.angle) * CONFIG.SHOOT_SPEED;
    let dy = Math.sin(this.angle) * CONFIG.SHOOT_SPEED;
    const points = [{ x, y }];

    for (let i = 0; i < 120; i++) {
      x += dx; y += dy;
      if (x < this.bubbleR) { x = this.bubbleR; dx *= -1; points.push({ x, y }); }
      if (x > canvasW - this.bubbleR) { x = canvasW - this.bubbleR; dx *= -1; points.push({ x, y }); }
      
      // Check grid hit simulation
      let hit = false;
      const stepBubble = { x, y };
      for (let r = 0; r < board.rows; r++) {
        const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
        for (let c = 0; c < maxC; c++) {
          if (board.grid[r][c] === null) continue;
          const pos = board.getHexPos(r, c);
          const distSq = (pos.x - x) ** 2 + (pos.y - y) ** 2;
          if (distSq < (board.bubbleRadius * 2) ** 2) { hit = true; break; }
        }
        if (hit) break;
      }
      if (y < board.offsetY || hit) { points.push({ x, y }); break; }
    }
    return points;
  }
}

// =========================================================================
// 4. COLLISION & FLOOD-FILL PACK
// =========================================================================
function checkGridCollision(bubble, board) {
  const thresholdSq = (board.bubbleRadius * 2) ** 2;
  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] === null) continue;
      const pos = board.getHexPos(r, c);
      if ((pos.x - bubble.x) ** 2 + (pos.y - bubble.y) ** 2 < thresholdSq) return { row: r, col: c };
    }
  }
  return null;
}

function findSnapPosition(bubble, board) {
  let best = null, bestDistSq = Infinity;
  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null) continue;
      const pos = board.getHexPos(r, c);
      const dSq = (pos.x - bubble.x) ** 2 + (pos.y - bubble.y) ** 2;
      if (dSq < bestDistSq) { bestDistSq = dSq; best = { row: r, col: c }; }
    }
  }
  return best;
}

function findConnected(board, row, col) {
  const target = board.grid[row]?.[col];
  if (target === null || target === undefined) return [];
  const visited = new Set(), matched = [], queue = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (board.grid[r]?.[c] !== target) continue;
    matched.push([r, c]);
    for (const nb of board.getNeighbors(r, c)) {
      if (!visited.has(`${nb[0]},${nb[1]}`)) queue.push(nb);
    }
  }
  return matched.length >= 3 ? matched : [];
}

function findFloating(board) {
  const connected = new Set(), queue = [];
  const maxC0 = (0 % 2 === 1) ? board.cols - 1 : board.cols;

  for (let c = 0; c < maxC0; c++) {
    if (board.grid[0][c] !== null) { queue.push([0, c]); connected.add(`0,${c}`); }
  }
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const nb of board.getNeighbors(r, c)) {
      const key = `${nb[0]},${nb[1]}`;
      if (!connected.has(key) && board.grid[nb[0]]?.[nb[1]] !== null) {
        connected.add(key); queue.push(nb);
      }
    }
  }
  const floating = [];
  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null && !connected.has(`${r},${c}`)) floating.push([r, c]);
    }
  }
  return floating;
}

// =========================================================================
// 5. OVERHAULED CANVAS RENDERING SYSTEM (STRICT IMAGE RENDERING)
// =========================================================================
class Renderer {
  constructor(ctx, images) {
    this.ctx = ctx; this.images = images;
    this.w = 0; this.h = 0; this.topH = 50;
  }

  resize(w, h) {
    this.w = w; this.h = h;
    this.topH = Math.max(50, Math.min(h * 0.08, 70));
  }

  drawBackground() {
    // FIXED: Renders 'backgraund.jpg' to fill the entire canvas viewport
    const bg = this.images['background'];
    if (bg && bg.complete && bg.naturalWidth > 0) {
      this.ctx.drawImage(bg, 0, 0, this.w, this.h);
    }
  }

  drawBubble(x, y, radius, colorIndex) {
    let img = null;
    if (colorIndex >= 0 && colorIndex < CONFIG.NUM_COLORS) {
      img = this.images[CONFIG.BUBBLE_COLORS[colorIndex].name];
    } else if (colorIndex === CONFIG.COLOR_SPECIAL) img = this.images['colorful'];
    else if (colorIndex === CONFIG.COLOR_AIR) img = this.images['air'];

    const size = radius * 2;
    // CRITICAL: Force image bounding box render instead of glowing circles
    if (img && img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, x - radius, y - radius, size, size);
    } else {
      this.ctx.beginPath(); this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = BUBBLE_FALLBACK_COLORS[colorIndex] || '#ff6b6b';
      this.ctx.fill();
    }
  }

  drawGrid(board) {
    for (let r = 0; r < board.rows; r++) {
      const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
      for (let c = 0; c < maxC; c++) {
        if (board.grid[r][c] !== null) {
          const pos = board.getHexPos(r, c);
          this.drawBubble(pos.x, pos.y, board.bubbleRadius, board.grid[r][c]);
        }
      }
    }
  }

  drawShooter(shooter) {
    this.ctx.save();
    this.ctx.translate(shooter.x, shooter.y);
    this.ctx.rotate(shooter.angle);
    const cannon = this.images['play'];
    const cSize = shooter.bubbleR * 2.4;
    if (cannon && cannon.complete && cannon.naturalWidth > 0) {
      this.ctx.drawImage(cannon, -cSize / 2, -cSize / 2, cSize, cSize);
    }
    this.ctx.restore();

    if (shooter.current !== null) {
      const tip = shooter.getTipPosition();
      this.drawBubble(tip.x, tip.y, shooter.bubbleR, shooter.current);
    }
  }

  drawTrajectory(shooter, canvasW, board) {
    const points = shooter.calculateTrajectory(canvasW, board);
    if (points.length < 2) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.setLineDash([6, 8]);
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) this.ctx.lineTo(points[i].x, points[i].y);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawParticles(particles) {
    for (const p of particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.drawBubble(p.x, p.y, p.radius, p.color);
      this.ctx.restore();
    }
  }

  drawHUD(score, level) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
    this.ctx.fillRect(0, 0, this.w, this.topH);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${score}`, 20, this.topH / 2 + 6);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Level: ${level}`, this.w - 20, this.topH / 2 + 6);
  }

  drawMainMenu() {
    this.drawBackground();
    const size = Math.min(this.w * 0.4, 140);
    this._playBtn = { x: this.w / 2 - size / 2, y: this.h * 0.55 - size / 2, w: size, h: size };
    const btn = this.images['premiumPlay'];
    if (btn && btn.complete && btn.naturalWidth > 0) {
      this.ctx.drawImage(btn, this._playBtn.x, this._playBtn.y, size, size);
    }
  }

  drawGameOver(score) {
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.fillText('GAME OVER', this.w / 2, this.h / 2 - 20);
    this.ctx.font = '18px sans-serif';
    this.ctx.fillText(`Final Score: ${score}`, this.w / 2, this.h / 2 + 15);
    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#a78bfa';
    this.ctx.fillText('Tap anywhere to Restart', this.w / 2, this.h / 2 + 55);
  }
}

// =========================================================================
// 6. SINGLE-ENGINE CONTROLLER LOOP
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const loadingScreen = document.getElementById('loadingScreen');
  const ctx = canvas.getContext('2d');
  const loader = new ImageLoader();

  // Enqueue assets
  loader.add('background', 'backgraund.jpg');
  for (const b of CONFIG.BUBBLE_COLORS) loader.add(b.name, CONFIG.IMAGE_PATH + b.file);
  loader.add('colorful', CONFIG.IMAGE_PATH + CONFIG.BUBBLE_SPECIAL.file);
  loader.add('air', CONFIG.IMAGE_PATH + CONFIG.BUBBLE_AIR.file);
  loader.add('premiumPlay', CONFIG.IMAGE_PATH + CONFIG.UI.premiumPlay);
  loader.add('back', CONFIG.IMAGE_PATH + CONFIG.UI.back);
  loader.add('pause', CONFIG.IMAGE_PATH + CONFIG.UI.pause);
  loader.add('play', CONFIG.IMAGE_PATH + CONFIG.UI.play);

  let board = new Board(), shooter = null, renderer = null;
  let score = 0, level = 1, state = 'LOADING', flyingBubble = null, shotsFired = 0;
  let particles = [];

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    if (renderer) renderer.resize(canvas.width, canvas.height);
    board.configure(canvas.width, canvas.height, renderer ? renderer.topH : 50);
    if (shooter) {
      shooter.x = canvas.width / 2;
      shooter.y = canvas.height - board.bubbleRadius * 2.5;
      shooter.bubbleR = board.bubbleRadius;
    }
  }
  window.addEventListener('resize', resize);

  function start() {
    state = 'PLAYING'; score = 0; level = 1; shotsFired = 0; particles = []; flyingBubble = null;
    board.generateInitial();
    shooter = new Shooter(canvas.width / 2, canvas.height - board.bubbleRadius * 2.5, board.bubbleRadius);
    shooter.refill();
    resize();
  }

  function handleInput(clientX, clientY, shoot = false) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);

    if (state === 'MENU' && shoot && renderer._playBtn) {
      if (mx >= renderer._playBtn.x && mx <= renderer._playBtn.x + renderer._playBtn.w &&
          my >= renderer._playBtn.y && my <= renderer._playBtn.y + renderer._playBtn.h) start();
    } else if (state === 'GAME_OVER' && shoot) {
      state = 'MENU';
    } else if (state === 'PLAYING' && shooter) {
      shooter.angle = Math.atan2(my - shooter.y, mx - shooter.x);
      if (shoot && !flyingBubble) {
        flyingBubble = {
          x: shooter.getTipPosition().x, y: shooter.getTipPosition().y,
          vx: Math.cos(shooter.angle) * CONFIG.SHOOT_SPEED,
          vy: Math.sin(shooter.angle) * CONFIG.SHOOT_SPEED,
          color: shooter.current
        };
        shooter.refill();
      }
    }
  }

  // Pointer Listeners
  canvas.addEventListener('mousedown', (e) => handleInput(e.clientX, e.clientY, true));
  window.addEventListener('mousemove', (e) => { if (state === 'PLAYING') handleInput(e.clientX, e.clientY, false); });
  canvas.addEventListener('touchstart', (e) => { if (e.touches.length > 0) handleInput(e.touches[0].clientX, e.touches[0].clientY, true); }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (state === 'PLAYING' && e.touches.length > 0) handleInput(e.touches[0].clientX, e.touches[0].clientY, false); }, { passive: true });

  function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: x, y: y,
        radius: board.bubbleRadius * 0.4,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        alpha: 1, color: color
      });
    }
  }

  // Main Loop Game Core
  function loop() {
    if (loader.done && state === 'LOADING') {
      state = 'MENU';
      loadingScreen.classList.add('hidden');
      renderer = new Renderer(ctx, loader.images);
      resize();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (renderer) {
      if (state === 'MENU') renderer.drawMainMenu();
      else if (state === 'PLAYING' || state === 'GAME_OVER') {
        renderer.drawBackground();
        renderer.drawGrid(board);
        if (state === 'PLAYING') {
          renderer.drawTrajectory(shooter, canvas.width, board);
          renderer.drawShooter(shooter);
        }

        // Flying bubble processing
        if (flyingBubble) {
          flyingBubble.x += flyingBubble.vx; flyingBubble.y += flyingBubble.vy;
          renderer.drawBubble(flyingBubble.x, flyingBubble.y, board.bubbleRadius, flyingBubble.color);

          // Wall bounces
          if (flyingBubble.x < board.bubbleRadius) { flyingBubble.x = board.bubbleRadius; flyingBubble.vx *= -1; }
          if (flyingBubble.x > canvas.width - board.bubbleRadius) { flyingBubble.x = canvas.width - board.bubbleRadius; flyingBubble.vx *= -1; }

          // Collision handling
          const gridHit = checkGridCollision(flyingBubble, board);
          if (gridHit || flyingBubble.y < board.offsetY) {
            const snap = findSnapPosition(flyingBubble, board);
            if (snap) {
              board.grid[snap.row][snap.col] = flyingBubble.color;
              const matches = findConnected(board, snap.row, snap.col);
              if (matches.length >= 3) {
                for (const [r, c] of matches) {
                  const p = board.getHexPos(r, c);
                  createExplosion(p.x, p.y, board.grid[r][c]);
                  board.grid[r][c] = null; score += CONFIG.POP_SCORE;
                }
                const floating = findFloating(board);
                for (const [r, c] of floating) {
                  const p = board.getHexPos(r, c);
                  createExplosion(p.x, p.y, board.grid[r][c]);
                  board.grid[r][c] = null; score += CONFIG.FLOAT_SCORE;
                }
              }
              shotsFired++;
              if (shotsFired % CONFIG.SHOTS_PER_ROW === 0) {
                board.shiftDown();
                if (board.checkGameOver()) state = 'GAME_OVER';
              }
            }
            flyingBubble = null;
          }
        }

        // Particles cycle
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.03;
          if (p.alpha <= 0) particles.splice(i, 1);
        }
        renderer.drawParticles(particles);
        renderer.drawHUD(score, level);
        if (state === 'GAME_OVER') renderer.drawGameOver(score);
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
});