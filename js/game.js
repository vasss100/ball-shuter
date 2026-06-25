// ==========================================
// 1. GLOBAL CONFIGURATION & EXACT PATHS
// ==========================================
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

// ==========================================
// 2. IMAGE LOADER WITH PROGRESS & FALLBACK
// ==========================================
class ImageLoader {
  constructor() {
    this.images = {};
    this.total = 0;
    this.loaded = 0;
  }

  add(key, path) {
    this.total++;
    const img = new Image();
    img.onload = () => {
      this.loaded++;
      this.updateUI();
    };
    img.onerror = () => {
      console.warn('Failed to load: ' + path + '. Using fallback for "' + key + '".');
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const fc = c.getContext('2d');
      const hue = (key.length * 60) % 360;
      fc.beginPath(); fc.arc(32, 32, 28, 0, Math.PI * 2);
      fc.fillStyle = 'hsl(' + hue + ', 70%, 60%)';
      fc.fill();
      const fb = new Image();
      fb.src = c.toDataURL();
      this.images[key] = fb;
      this.loaded++;
      this.updateUI();
    };
    img.src = path;
    this.images[key] = img;
  }

  updateUI() {
    const txt = document.getElementById('loadingText');
    if (txt) txt.innerText = 'Loading ' + Math.round(this.progress * 100) + '%';
  }

  get done() { return this.loaded >= this.total; }
  get progress() { return this.total === 0 ? 1 : this.loaded / this.total; }
}

// ==========================================
// 3. PARTICLE EFFECTS
// ==========================================
function createExplosion(x, y, colorIndex, bubbleRadius) {
  const count = 8 + Math.floor(Math.random() * 3);
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      r: bubbleRadius * 0.15,
      baseR: bubbleRadius * 0.15,
      color: colorIndex,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
    });
  }
  return particles;
}

function createFlashParticles(x, y, count, bubbleRadius) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * bubbleRadius * 0.15;
    particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: 0, vy: 0,
      r: bubbleRadius * 0.6 * (0.5 + Math.random() * 0.5),
      baseR: bubbleRadius * 0.6 * (0.5 + Math.random() * 0.5),
      color: -1,
      life: 1,
      decay: 0.04 + Math.random() * 0.03,
    });
  }
  return particles;
}

function updateParticles(particles, maxParticles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.07;
    p.vx *= 0.97;
    p.life -= p.decay;
    p.r = p.baseR * p.life;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }
}

// ==========================================
// 4. HEXAGONAL BOARD
// ==========================================
class Board {
  constructor() {
    this.grid = [];
    this.bubbleRadius = 20;
    this.hexW = 34;
    this.hexH = 40;
    this.offsetX = 0;
    this.offsetY = 0;
    this.cols = CONFIG.COLS;
    this.rows = CONFIG.ROWS;
    this.levelBubblesStart = 0;
  }

  configure(canvasW, canvasH, topH) {
    const pad = canvasW * 0.04;
    const availW = canvasW - pad * 2;
    let r = availW / (this.cols * Math.sqrt(3) + Math.sqrt(3) / 2);
    const maxR = ((canvasH - topH - 20) * 0.72) / (this.rows * 1.5);
    if (r > maxR) r = maxR;
    this.bubbleRadius = r;
    this.hexW = Math.sqrt(3) * r;
    this.hexH = 2 * r;
    this.offsetX = (canvasW - this.cols * this.hexW) / 2;
    this.offsetY = topH + 10 + r * 1.5;
  }

  clear() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) this.grid[r][c] = null;
    }
  }

  generateInitial() {
    this.clear();
    let count = 0;
    for (let r = 0; r < CONFIG.INITIAL_ROWS; r++) {
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = Math.floor(Math.random() * CONFIG.NUM_COLORS);
        count++;
      }
    }
    this.levelBubblesStart = count;
  }

  getHexPos(row, col) {
    const odd = row % 2;
    return {
      x: this.offsetX + (odd ? this.hexW : this.hexW / 2) + col * this.hexW,
      y: this.offsetY + row * this.hexH * 0.75,
    };
  }

  getNeighbors(row, col) {
    const nb = [];
    const odd = row % 2;
    const offsets = odd
      ? [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
      : [[0, -1], [0, 1], [-1, -1], [1, -1], [-1, 0], [1, 0]];
    for (const [dr, dc] of offsets) {
      const nr = row + dr, nc = col + dc;
      const maxC = nr % 2 === 1 ? this.cols - 1 : this.cols;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < maxC) nb.push([nr, nc]);
    }
    return nb;
  }

  removeBubbles(positions) {
    for (const [r, c] of positions) this.grid[r][c] = null;
  }

  checkGameOver() {
    const maxC = (this.rows - 1) % 2 === 1 ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC; c++) {
      if (this.grid[this.rows - 1][c] !== null) return true;
    }
    return false;
  }

  shiftDown() {
    for (let r = this.rows - 1; r > 0; r--) {
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        const prevMaxC = (r - 1) % 2 === 1 ? this.cols - 1 : this.cols;
        this.grid[r][c] = c < prevMaxC ? this.grid[r - 1][c] : null;
      }
    }
    const maxC0 = 0 % 2 === 1 ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC0; c++) {
      this.grid[0][c] = Math.floor(Math.random() * CONFIG.NUM_COLORS);
    }
  }

  isEmpty() {
    for (let r = 0; r < this.rows; r++) {
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        if (this.grid[r][c] !== null) return false;
      }
    }
    return true;
  }
}

// ==========================================
// 5. FLOOD-FILL CONNECTED & FLOATING
// ==========================================
function findConnected(board, row, col, minMatch) {
  const target = board.grid[row]?.[col];
  if (target === null || target === undefined) return [];
  const isWildcard = target === CONFIG.COLOR_SPECIAL;
  const visited = new Set();
  const matched = [];
  const queue = [[row, col]];
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = r + ',' + c;
    if (visited.has(key)) continue;
    visited.add(key);
    const val = board.grid[r]?.[c];
    if (val === null || val === undefined) continue;
    if (!isWildcard && val !== target && val !== CONFIG.COLOR_SPECIAL) continue;
    if (val === CONFIG.COLOR_AIR) continue;
    matched.push([r, c]);
    for (const nb of board.getNeighbors(r, c)) {
      if (!visited.has(nb[0] + ',' + nb[1])) queue.push(nb);
    }
  }
  if (isWildcard) {
    const colorCounts = {};
    let wildcardCount = 0;
    for (const [r, c] of matched) {
      const v = board.grid[r][c];
      if (v === CONFIG.COLOR_SPECIAL) wildcardCount++;
      else if (v !== null && v !== undefined) {
        colorCounts[v] = (colorCounts[v] || 0) + 1;
      }
    }
    let bestColor = null, bestCount = 0;
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > bestCount) { bestCount = count; bestColor = parseInt(color); }
    }
    if (bestColor !== null && bestCount + wildcardCount >= minMatch) {
      const result = [];
      const seen = new Set();
      for (const [r, c] of matched) {
        const v = board.grid[r][c];
        if (v === CONFIG.COLOR_SPECIAL || v === bestColor) {
          const key = r + ',' + c;
          if (!seen.has(key)) { seen.add(key); result.push([r, c]); }
        }
      }
      return result;
    }
    return [];
  }
  const filtered = [];
  for (const [r, c] of matched) {
    const v = board.grid[r][c];
    if (v === target || v === CONFIG.COLOR_SPECIAL) filtered.push([r, c]);
  }
  return filtered.length >= minMatch ? filtered : [];
}

function findFloating(board) {
  const connected = new Set();
  const queue = [];
  for (let c = 0; c < board.cols; c++) {
    if (board.grid[0][c] !== null) { queue.push([0, c]); connected.add('0,' + c); }
  }
  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const nb of board.getNeighbors(r, c)) {
      const key = nb[0] + ',' + nb[1];
      if (!connected.has(key) && board.grid[nb[0]]?.[nb[1]] !== null) {
        connected.add(key);
        queue.push(nb);
      }
    }
  }
  const floating = [];
  for (let r = 0; r < board.rows; r++) {
    const maxC = r % 2 === 1 ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null && !connected.has(r + ',' + c)) {
        floating.push([r, c]);
      }
    }
  }
  return floating;
}

// ==========================================
// 6. SHOOTER
// ==========================================
class Shooter {
  constructor(x, y, bubbleR) {
    this.x = x;
    this.y = y;
    this.bubbleR = bubbleR;
    this.angle = -Math.PI / 2;
    this.current = null;
    this.next = null;
  }

  refill() {
    const r = Math.random();
    let color;
    if (r < CONFIG.SPECIAL_CHANCE) color = CONFIG.COLOR_SPECIAL;
    else if (r < CONFIG.SPECIAL_CHANCE + CONFIG.AIR_CHANCE) color = CONFIG.COLOR_AIR;
    else color = Math.floor(Math.random() * CONFIG.NUM_COLORS);
    this.current = this.next !== null ? this.next : color;
    this.next = color;
  }

  setAngle(angle) { this.angle = angle; }

  getTipPosition() {
    return {
      x: this.x + Math.cos(this.angle) * this.bubbleR * 1.8,
      y: this.y + Math.sin(this.angle) * this.bubbleR * 1.8,
    };
  }

  calculateTrajectory(canvasW) {
    const tip = this.getTipPosition();
    let x = tip.x, y = tip.y;
    let dx = Math.cos(this.angle), dy = Math.sin(this.angle);
    const step = Math.max(3, this.bubbleR * 0.15);
    const maxSteps = 300;
    let reflected = false;
    const points = [{ x, y }];
    for (let i = 0; i < maxSteps; i++) {
      x += dx * step; y += dy * step;
      if (y <= this.bubbleR) { points.push({ x, y: this.bubbleR }); break; }
      if (!reflected) {
        if (x < this.bubbleR) { x = this.bubbleR; dx = -dx; reflected = true; }
        else if (x > canvasW - this.bubbleR) { x = canvasW - this.bubbleR; dx = -dx; reflected = true; }
      } else if (x < this.bubbleR || x > canvasW - this.bubbleR) break;
      points.push({ x, y });
    }
    return points;
  }
}

// ==========================================
// 7. PHYSICS / COLLISION FUNCTIONS
// ==========================================
function createFlyingBubble(shooter) {
  const tip = shooter.getTipPosition();
  return {
    x: tip.x, y: tip.y,
    vx: Math.cos(shooter.angle) * CONFIG.SHOOT_SPEED,
    vy: Math.sin(shooter.angle) * CONFIG.SHOOT_SPEED,
    color: shooter.current,
  };
}

function moveBubble(bubble, canvasW, bubbleR) {
  bubble.x += bubble.vx;
  bubble.y += bubble.vy;
  if (bubble.x < bubbleR) { bubble.x = bubbleR + (bubbleR - bubble.x); bubble.vx = Math.abs(bubble.vx); }
  if (bubble.x > canvasW - bubbleR) { bubble.x = canvasW - bubbleR - (bubble.x - (canvasW - bubbleR)); bubble.vx = -Math.abs(bubble.vx); }
}

function checkGridCollision(bubble, board) {
  const thresholdSq = (board.bubbleRadius * 2) * (board.bubbleRadius * 2);
  for (let r = 0; r < board.rows; r++) {
    const maxC = r % 2 === 1 ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] === null) continue;
      const pos = board.getHexPos(r, c);
      const dx = pos.x - bubble.x, dy = pos.y - bubble.y;
      if (dx * dx + dy * dy < thresholdSq) return { row: r, col: c };
    }
  }
  return null;
}

function findSnapPosition(bubble, board) {
  let best = null, bestDistSq = Infinity;
  for (let r = 0; r < board.rows; r++) {
    const maxC = r % 2 === 1 ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null) continue;
      const pos = board.getHexPos(r, c);
      const d = (pos.x - bubble.x) * (pos.x - bubble.x) + (pos.y - bubble.y) * (pos.y - bubble.y);
      if (d < bestDistSq) { bestDistSq = d; best = { row: r, col: c }; }
    }
  }
  return best;
}

// ==========================================
// 8. RENDERER — IMAGE-BASED (NO GRADIENTS)
// ==========================================
class Renderer {
  constructor(ctx, images) {
    this.ctx = ctx;
    this.images = images;
    this.w = 0;
    this.h = 0;
    this.topH = 0;
    this._playBtn = null;
    this._backBtn = null;
    this._pauseBtn = null;
    this._resumeBtn = null;
    this._menuBtn = null;
    this._restartBtn = null;
    this._gameOverMenuBtn = null;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.topH = Math.max(50, Math.min(h * 0.08, 70));
  }

  // ----------------------------------------------------------------
  // FIXED: drawBackground now renders the backgraund.jpg
  // ----------------------------------------------------------------
  drawBackground() {
    const bg = this.images['background'];
    if (bg && bg.complete && bg.naturalWidth > 0) {
      this.ctx.drawImage(bg, 0, 0, this.w, this.h);
    }
  }

  getBubbleImage(colorIndex) {
    if (colorIndex >= 0 && colorIndex < CONFIG.NUM_COLORS) {
      return this.images[CONFIG.BUBBLE_COLORS[colorIndex].name];
    }
    if (colorIndex === CONFIG.COLOR_SPECIAL) return this.images['colorful'];
    if (colorIndex === CONFIG.COLOR_AIR) return this.images['air'];
    return null;
  }

  // ----------------------------------------------------------------
  // FIXED: drawBubble uses preloaded Image (no gradient circles)
  // ----------------------------------------------------------------
  drawBubble(x, y, radius, colorIndex) {
    const img = this.getBubbleImage(colorIndex);
    const size = radius * 2;
    if (img && img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, x - radius, y - radius, size, size);
    }
  }

  drawGrid(board) {
    for (let r = 0; r < board.rows; r++) {
      const maxC = r % 2 === 1 ? board.cols - 1 : board.cols;
      for (let c = 0; c < maxC; c++) {
        const val = board.grid[r][c];
        if (val !== null) {
          const pos = board.getHexPos(r, c);
          this.drawBubble(pos.x, pos.y, board.bubbleRadius, val);
        }
      }
    }
  }

  // ----------------------------------------------------------------
  // FIXED: Shooter cannon uses 'play' image asset
  // ----------------------------------------------------------------
  drawShooter(shooter) {
    const tip = shooter.getTipPosition();
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(shooter.x, shooter.y);
    ctx.rotate(shooter.angle);
    const cannonImg = this.images['play'];
    const cannonSize = shooter.bubbleR * 2.2;
    if (cannonImg && cannonImg.complete && cannonImg.naturalWidth > 0) {
      ctx.drawImage(cannonImg, -cannonSize / 2, -cannonSize / 2, cannonSize, cannonSize);
    }
    ctx.restore();

    if (shooter.current !== null) {
      this.drawBubble(tip.x, tip.y, shooter.bubbleR, shooter.current);
    }
  }

  drawTrajectory(shooter, canvasW) {
    const points = shooter.calculateTrajectory(canvasW);
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = 'rgba(167,139,250,0.1)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.setLineDash([6, 8]);
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawShrinkingBubble(x, y, radius, colorIndex, maxRadius) {
    if (radius <= 0) return;
    const img = this.getBubbleImage(colorIndex);
    const size = radius * 2;
    const t = Math.max(0, radius / (maxRadius || radius));
    if (img && img.complete && img.naturalWidth > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = t;
      this.ctx.drawImage(img, x - radius, y - radius, size, size);
      this.ctx.restore();
    }
  }

  drawParticles(particles) {
    for (const p of particles) {
      if (p.life <= 0) continue;
      const img = p.color >= 0 ? this.getBubbleImage(p.color) : this.images['colorful'];
      const size = p.r * 2;
      if (img && img.complete && img.naturalWidth > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life;
        this.ctx.drawImage(img, p.x - p.r, p.y - p.r, size, size);
        this.ctx.restore();
      }
    }
  }

  drawHUD(score, level, progress) {
    const th = this.topH;
    const w = this.w;
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, w, th + 8);
    ctx.restore();

    const btnSize = th * 0.55;
    const btnY = (th - btnSize) / 2;
    const pad = 10;

    this._backBtn = { x: pad, y: btnY, w: btnSize, h: btnSize };
    this.drawImage('back', this._backBtn);

    const pauseX = w - pad - btnSize;
    this._pauseBtn = { x: pauseX, y: btnY, w: btnSize, h: btnSize };
    this.drawImage('pause', this._pauseBtn);

    const barL = pad * 2 + btnSize + 8;
    const barR = pauseX - 8;
    const barW = barR - barL;
    const barH = th * 0.3;
    const barY = (th - barH) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barL, barY, barW, barH);
    if (progress > 0.01) {
      const fillW = barW * Math.min(progress, 1);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(barL, barY, fillW, barH);
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold ' + Math.round(th * 0.26) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('' + score, barL, barY + barH + 2);
    ctx.textAlign = 'right';
    ctx.fillText('' + level, barR, barY + barH + 2);
    ctx.restore();
  }

  drawImage(key, rect) {
    const img = this.images[key];
    if (img && img.complete && img.naturalWidth > 0) {
      this.ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    }
  }

  drawMainMenu() {
    this.drawBackground();

    const w = this.w, h = this.h;
    const s = Math.min(w * 0.2, h * 0.15) * 1.6;
    const playY = h * 0.52;

    const playImg = this.images['premiumPlay'];
    if (playImg && playImg.complete && playImg.naturalWidth > 0) {
      this.ctx.save();
      const pulse = 1 + Math.sin(Date.now() / 600) * 0.03;
      this.ctx.shadowColor = 'rgba(255,215,0,0.3)';
      this.ctx.shadowBlur = 20 * pulse;
      this.ctx.drawImage(playImg, w / 2 - s / 2, playY - s / 2, s, s);
      this.ctx.restore();
    }

    this._playBtn = { x: w / 2 - s / 2, y: playY - s / 2, w: s, h: s };
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    const w = this.w, h = this.h;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    const pw = Math.min(w * 0.5, 260);
    const ph = Math.min(h * 0.35, 180);
    const px = (w - pw) / 2, py = (h - ph) / 2;

    ctx.fillStyle = 'rgba(20,15,40,0.9)';
    ctx.fillRect(px, py, pw, ph);

    const bw = pw * 0.4, bh = ph * 0.2;
    const by = py + ph * 0.45;
    const bx = w / 2 - bw / 2;

    this._resumeBtn = { x: bx, y: by, w: bw, h: bh };
    this.drawImage('play', this._resumeBtn);

    const my = by + bh + 12;
    this._menuBtn = { x: bx, y: my, w: bw, h: bh };
    this.drawImage('back', this._menuBtn);

    ctx.restore();
  }

  drawGameOver(score) {
    const ctx = this.ctx;
    const w = this.w, h = this.h;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, w, h);

    const pw = Math.min(w * 0.55, 280);
    const ph = Math.min(h * 0.35, 180);
    const px = (w - pw) / 2, py = (h - ph) / 2;

    ctx.fillStyle = 'rgba(20,15,40,0.9)';
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(ph * 0.14) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('' + score, w / 2, py + ph * 0.3);

    const bw = pw * 0.5, bh = ph * 0.18;
    const by = py + ph * 0.52;

    this._restartBtn = { x: w / 2 - bw / 2, y: by, w: bw, h: bh };
    this.drawImage('premiumPlay', this._restartBtn);

    const my = by + bh + 10;
    this._gameOverMenuBtn = { x: w / 2 - bw / 2, y: my, w: bw, h: bh };
    this.drawImage('back', this._gameOverMenuBtn);

    ctx.restore();
  }

  hitTest(btn, x, y) {
    if (!btn) return false;
    return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }
}

// ==========================================
// 9. INPUT HANDLER (TOUCH + MOUSE)
// ==========================================
class InputHandler {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.isDown = false;
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    canvas.addEventListener('mousedown', this.onDown);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp);
    canvas.addEventListener('touchstart', this.onDown, { passive: false });
    window.addEventListener('touchmove', this.onMove, { passive: false });
    window.addEventListener('touchend', this.onUp);
    canvas.addEventListener('touchcancel', this.onUp, { passive: false });
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  onDown(e) {
    e.preventDefault();
    this.isDown = true;
    if (this.callbacks.pointerDown) this.callbacks.pointerDown(this.getPos(e));
  }

  onMove(e) {
    e.preventDefault();
    if (this.callbacks.pointerMove) this.callbacks.pointerMove(this.getPos(e), this.isDown);
  }

  onUp(e) {
    e.preventDefault();
    if (this.isDown && this.callbacks.pointerUp) this.callbacks.pointerUp(this.getPos(e));
    this.isDown = false;
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mouseup', this.onUp);
    this.canvas.removeEventListener('touchstart', this.onDown);
    window.removeEventListener('touchmove', this.onMove);
    window.removeEventListener('touchend', this.onUp);
    this.canvas.removeEventListener('touchcancel', this.onUp);
  }
}

// ==========================================
// 10. GAME ENGINE — DOMContentLoaded BOOT
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const loadingScreen = document.getElementById('loadingScreen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;

  const loader = new ImageLoader();
  const bp = CONFIG.IMAGE_PATH;

  loader.add('background', 'backgraund.jpg');
  for (const b of CONFIG.BUBBLE_COLORS) loader.add(b.name, bp + b.file);
  loader.add('colorful', bp + CONFIG.BUBBLE_SPECIAL.file);
  loader.add('air', bp + CONFIG.BUBBLE_AIR.file);
  loader.add('premiumPlay', bp + CONFIG.UI.premiumPlay);
  loader.add('back', bp + CONFIG.UI.back);
  loader.add('pause', bp + CONFIG.UI.pause);
  loader.add('play', bp + CONFIG.UI.play);

  let game = null;
  let gameState = 'LOADING';
  let isPaused = false;

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  function handleResize() {
    resizeCanvas();
    if (game) game.resize();
  }

  window.addEventListener('resize', handleResize);

  class Game {
    constructor() {
      this.board = new Board();
      this.shooter = null;
      this.score = 0;
      this.level = 1;
      this.state = 'MENU';
      this.flyingBubble = null;
      this.particles = [];
      this.dyingBubbles = [];
      this.shotsSinceRow = 0;
      this.aimPos = null;
      this.renderer = null;
      this.input = null;
      this.levelProgress = 0;
      this.initialBubbleCount = 0;
      this.totalBubblesPopped = 0;
    }

    init() {
      this.renderer = new Renderer(ctx, loader.images);
      this.renderer.resize(canvas.width, canvas.height);
      this.board.configure(canvas.width, canvas.height, this.renderer.topH);
      this.input = new InputHandler(canvas, {
        pointerDown: (pos) => this.onPointerDown(pos),
        pointerMove: (pos, down) => this.onPointerMove(pos, down),
        pointerUp: (pos) => this.onPointerUp(pos),
      });
    }

    resize() {
      if (this.renderer) this.renderer.resize(canvas.width, canvas.height);
      if (this.board) {
        this.board.configure(canvas.width, canvas.height, this.renderer ? this.renderer.topH : 50);
        if (this.shooter) {
          this.shooter.x = canvas.width / 2;
          this.shooter.y = canvas.height - this.board.bubbleRadius * 3.5;
          this.shooter.bubbleR = this.board.bubbleRadius;
        }
      }
    }

    startGame() {
      this.score = 0;
      this.level = 1;
      this.shotsSinceRow = 0;
      this.particles = [];
      this.dyingBubbles = [];
      this.flyingBubble = null;
      this.aimPos = null;
      this.totalBubblesPopped = 0;
      this.state = 'PLAYING';
      isPaused = false;
      this.board.configure(canvas.width, canvas.height, this.renderer.topH);
      this.board.generateInitial();
      this.initialBubbleCount = this.board.levelBubblesStart;
      this.levelProgress = 0;
      const shootY = canvas.height - this.board.bubbleRadius * 3.5;
      this.shooter = new Shooter(canvas.width / 2, shootY, this.board.bubbleRadius);
      this.shooter.refill();
    }

    onPointerDown(pos) {
      if (this.state === 'MENU') {
        if (this.renderer.hitTest(this.renderer._playBtn, pos.x, pos.y)) this.startGame();
        return;
      }

      if (this.state === 'PLAYING') {
        if (this.renderer.hitTest(this.renderer._pauseBtn, pos.x, pos.y)) { isPaused = true; return; }
        if (this.renderer.hitTest(this.renderer._backBtn, pos.x, pos.y)) { this.state = 'MENU'; isPaused = false; return; }
        this.aimPos = pos;
        this.handleAim(pos);
        return;
      }

      if (isPaused) {
        if (this.renderer.hitTest(this.renderer._resumeBtn, pos.x, pos.y)) { isPaused = false; return; }
        if (this.renderer.hitTest(this.renderer._menuBtn, pos.x, pos.y)) { isPaused = false; this.state = 'MENU'; return; }
        return;
      }

      if (this.state === 'GAME_OVER') {
        if (this.renderer.hitTest(this.renderer._restartBtn, pos.x, pos.y)) { this.startGame(); return; }
        if (this.renderer.hitTest(this.renderer._gameOverMenuBtn, pos.x, pos.y)) { this.state = 'MENU'; return; }
      }
    }

    onPointerMove(pos, down) {
      if (this.state === 'PLAYING' && down && !isPaused) {
        this.aimPos = pos;
        this.handleAim(pos);
      }
    }

    onPointerUp() {
      if (this.state === 'PLAYING' && !isPaused && this.shooter && this.shooter.current !== null) {
        this.flyingBubble = createFlyingBubble(this.shooter);
        this.shooter.refill();
        this.shotsSinceRow++;
      }
    }

    handleAim(pos) {
      if (this.state !== 'PLAYING' || isPaused || !this.shooter) return;
      const dx = pos.x - this.shooter.x;
      const dy = pos.y - this.shooter.y;
      let angle = Math.atan2(dy, dx);
      if (angle > -0.05) angle = -0.05;
      if (angle < -Math.PI + 0.05) angle = -Math.PI + 0.05;
      this.shooter.setAngle(angle);
    }

    update() {
      if (this.state !== 'PLAYING' || isPaused) return;

      if (this.flyingBubble) {
        moveBubble(this.flyingBubble, canvas.width, this.board.bubbleRadius);
        if (this.flyingBubble.y < this.board.bubbleRadius) { this.placeBubble(this.flyingBubble); return; }
        if (this.flyingBubble.y > canvas.height + this.board.bubbleRadius) { this.flyingBubble = null; return; }
        const hit = checkGridCollision(this.flyingBubble, this.board);
        if (hit) this.placeBubble(this.flyingBubble);
      }

      updateParticles(this.particles, CONFIG.MAX_PARTICLES);
      this.updateDyingBubbles();
    }

    placeBubble(bubble) {
      const snap = findSnapPosition(bubble, this.board);
      if (!snap) { this.flyingBubble = null; return; }

      if (bubble.color === CONFIG.COLOR_AIR) {
        this.flyingBubble = null;
        this.board.grid[snap.row][snap.col] = bubble.color;
        const blastCells = [];
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = snap.row + dr, nc = snap.col + dc;
            const maxC = nr >= 0 && nr < this.board.rows ? (nr % 2 === 1 ? this.board.cols - 1 : this.board.cols) : 0;
            if (nr >= 0 && nr < this.board.rows && nc >= 0 && nc < maxC && this.board.grid[nr][nc] !== null) {
              blastCells.push([nr, nc]);
            }
          }
        }
        this.processBlastAndFloating(blastCells);
        this.finishTurn();
        return;
      }

      this.board.grid[snap.row][snap.col] = bubble.color;
      this.flyingBubble = null;
      const matches = findConnected(this.board, snap.row, snap.col, 3);
      if (matches.length > 0) this.processBlastAndFloating(matches);
      this.finishTurn();
    }

    processBlastAndFloating(cells) {
      for (const [r, c] of cells) {
        const p = this.board.getHexPos(r, c);
        const val = this.board.grid[r][c];
        if (val !== null) {
          this.dyingBubbles.push({ x: p.x, y: p.y, color: val, radius: this.board.bubbleRadius, maxRadius: this.board.bubbleRadius });
          this.particles.push(...createExplosion(p.x, p.y, val, this.board.bubbleRadius));
          this.particles.push(...createFlashParticles(p.x, p.y, 3, this.board.bubbleRadius));
          this.score += CONFIG.POP_SCORE;
          this.totalBubblesPopped++;
        }
      }
      this.board.removeBubbles(cells);

      const floating = findFloating(this.board);
      for (const [r, c] of floating) {
        const p = this.board.getHexPos(r, c);
        const val = this.board.grid[r][c];
        if (val !== null) {
          this.dyingBubbles.push({ x: p.x, y: p.y, color: val, radius: this.board.bubbleRadius, maxRadius: this.board.bubbleRadius });
          this.particles.push(...createExplosion(p.x, p.y, val, this.board.bubbleRadius));
          this.particles.push(...createFlashParticles(p.x, p.y, 3, this.board.bubbleRadius));
          this.score += CONFIG.FLOAT_SCORE;
          this.totalBubblesPopped++;
        }
      }
      this.board.removeBubbles(floating);
    }

    finishTurn() {
      this.levelProgress = this.initialBubbleCount > 0
        ? Math.min(1, this.totalBubblesPopped / this.initialBubbleCount) : 0;

      if (this.board.isEmpty()) { this.advanceLevel(); return; }
      if (this.board.checkGameOver()) { this.gameOver(); return; }

      if (this.shotsSinceRow >= CONFIG.SHOTS_PER_ROW) {
        this.shotsSinceRow = 0;
        this.board.shiftDown();
        if (this.board.checkGameOver()) { this.gameOver(); }
      }
    }

    advanceLevel() {
      this.level++;
      this.board.configure(canvas.width, canvas.height, this.renderer.topH);
      this.board.generateInitial();
      this.initialBubbleCount = this.board.levelBubblesStart;
      this.totalBubblesPopped = 0;
      this.levelProgress = 0;
      this.shotsSinceRow = 0;
      if (this.shooter) {
        this.shooter.x = canvas.width / 2;
        this.shooter.y = canvas.height - this.board.bubbleRadius * 3.5;
        this.shooter.bubbleR = this.board.bubbleRadius;
        this.shooter.refill();
      }
    }

    gameOver() { this.state = 'GAME_OVER'; }

    updateDyingBubbles() {
      for (let i = this.dyingBubbles.length - 1; i >= 0; i--) {
        const b = this.dyingBubbles[i];
        b.radius -= b.maxRadius * 0.06;
        if (b.radius <= 0) this.dyingBubbles.splice(i, 1);
      }
    }

    render() {
      if (this.state === 'MENU') { this.renderer.drawMainMenu(); return; }

      this.renderer.drawBackground();

      if (this.state === 'PLAYING' || this.state === 'GAME_OVER') {
        this.renderer.drawGrid(this.board);

        if (this.shooter && this.state === 'PLAYING') {
          if (this.aimPos) this.renderer.drawTrajectory(this.shooter, canvas.width);
          this.renderer.drawShooter(this.shooter);
        }

        if (this.flyingBubble && this.state === 'PLAYING') {
          this.renderer.drawBubble(this.flyingBubble.x, this.flyingBubble.y, this.board.bubbleRadius, this.flyingBubble.color);
        }

        for (const b of this.dyingBubbles) {
          this.renderer.drawShrinkingBubble(b.x, b.y, b.radius, b.color, b.maxRadius);
        }

        this.renderer.drawParticles(this.particles);
        this.renderer.drawHUD(this.score, this.level, this.levelProgress);
      }

      if (this.state === 'GAME_OVER') this.renderer.drawGameOver(this.score);
      if (isPaused && this.state === 'PLAYING') this.renderer.drawPauseOverlay();
    }
  }

  function gameLoop() {
    if (loader.done && gameState === 'LOADING') {
      gameState = 'READY';
      loadingScreen.classList.add('hidden');
      game = new Game();
      game.init();
      game.state = 'MENU';
    }

    if (gameState === 'LOADING') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(loader.progress * 100) + '%', canvas.width / 2, canvas.height / 2 + 40);
    }

    if (game) { game.update(); game.render(); }
    requestAnimationFrame(gameLoop);
  }

  resizeCanvas();
  gameLoop();
});
