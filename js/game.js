import { Board } from './board.js';
import { Shooter } from './shooter.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { createFlyingBubble, moveBubble } from './physics.js';
import { checkGridCollision, findSnapPosition } from './collision.js';
import { findConnected, findFloating } from './floodfill.js';
import { createExplosion, createFlashParticles, updateParticles } from './particles.js';
import { COLORS, POP_SCORE, FLOAT_SCORE, SHOTS_PER_ROW } from './constants.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.board = null;
    this.shooter = null;
    this.renderer = null;
    this.input = null;
    this.score = 0;
    this.level = 1;
    this.state = 'AIMING';
    this.flyingBubble = null;
    this.particles = [];
    this.dyingBubbles = [];
    this.shotsSinceRow = 0;
    this.aimPos = null;
    this.animId = null;

    this.setup();
  }

  setup() {
    this.resize();
    this.renderer = new Renderer(this.ctx);
    this.renderer.resize(this.canvas.width, this.canvas.height);

    this.board = new Board(this.canvas.width, this.canvas.height);
    this.board.generateInitial();

    const shootY = this.canvas.height - this.board.bubbleRadius * 3.5;
    this.shooter = new Shooter(this.canvas.width / 2, shootY, this.board.bubbleRadius);
    this.shooter.refill();

    this.input = new InputHandler(this.canvas, {
      aim: (pos) => this.handleAim(pos),
      shoot: () => this.handleShoot(),
    });

    document.getElementById('restartBtn').addEventListener('click', () => this.restart());

    this.updateUI();
    this.loop();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    if (this.board) {
      this.board.configure(this.canvas.width, this.canvas.height);
    }
    if (this.shooter) {
      this.shooter.x = this.canvas.width / 2;
      this.shooter.y = this.canvas.height - (this.board ? this.board.bubbleRadius * 3.5 : 60);
      if (this.board) this.shooter.bubbleR = this.board.bubbleRadius;
    }
    if (this.renderer) {
      this.renderer.resize(this.canvas.width, this.canvas.height);
    }
  }

  handleAim(pos) {
    if (this.state !== 'AIMING') return;
    this.aimPos = pos;
    const dx = pos.x - this.shooter.x;
    const dy = pos.y - this.shooter.y;
    let angle = Math.atan2(dy, dx);
    if (angle > -0.05) angle = -0.05;
    if (angle < -Math.PI + 0.05) angle = -Math.PI + 0.05;
    this.shooter.setAngle(angle);
  }

  handleShoot() {
    if (this.state !== 'AIMING') return;
    if (this.shooter.current === null || this.shooter.current === undefined) return;

    this.flyingBubble = createFlyingBubble(this.shooter);
    this.shooter.refill();
    this.state = 'SHOOTING';
    this.shotsSinceRow++;
  }

  update() {
    if (this.state === 'SHOOTING') {
      this.updateFlyingBubble();
    }
    updateParticles(this.particles);
    this.updateDyingBubbles();
  }

  updateFlyingBubble() {
    const b = this.flyingBubble;
    if (!b) return;

    moveBubble(b, this.canvas.width, this.board.bubbleRadius);

    if (b.y < this.board.bubbleRadius) {
      this.placeBubble(b);
      return;
    }
    if (b.y > this.canvas.height + this.board.bubbleRadius) {
      this.state = 'AIMING';
      this.flyingBubble = null;
      return;
    }

    const hit = checkGridCollision(b, this.board);
    if (hit) {
      this.placeBubble(b);
    }
  }

  placeBubble(bubble) {
    const snap = findSnapPosition(bubble, this.board);
    if (!snap) {
      this.state = 'AIMING';
      this.flyingBubble = null;
      return;
    }

    this.board.grid[snap.row][snap.col] = bubble.color;
    this.flyingBubble = null;

    this.state = 'PROCESSING';
    this.processMatches(snap.row, snap.col);
  }

  processMatches(row, col) {
    const matches = findConnected(this.board, row, col);

    if (matches.length > 0) {
      for (const [r, c] of matches) {
        const p = this.board.getHexPos(r, c);
        const color = this.board.grid[r][c];
        if (color !== null && color !== undefined) {
          this.dyingBubbles.push({
            x: p.x, y: p.y,
            color,
            radius: this.board.bubbleRadius,
            maxRadius: this.board.bubbleRadius,
          });
          this.particles.push(...createExplosion(p.x, p.y, color, this.board.bubbleRadius));
          this.particles.push(...createFlashParticles(p.x, p.y, 3, this.board.bubbleRadius));
        }
      }
      this.board.removeBubbles(matches);
      this.score += matches.length * POP_SCORE;

      const floating = findFloating(this.board);
      for (const [r, c] of floating) {
        const p = this.board.getHexPos(r, c);
        const color = this.board.grid[r][c];
        if (color !== null && color !== undefined) {
          this.dyingBubbles.push({
            x: p.x, y: p.y,
            color,
            radius: this.board.bubbleRadius,
            maxRadius: this.board.bubbleRadius,
          });
          this.particles.push(...createExplosion(p.x, p.y, color, this.board.bubbleRadius));
          this.particles.push(...createFlashParticles(p.x, p.y, 3, this.board.bubbleRadius));
        }
      }
      this.board.removeBubbles(floating);
      this.score += floating.length * FLOAT_SCORE;

      this.updateUI();
    }

    if (this.board.checkGameOver()) {
      this.state = 'GAME_OVER';
      document.getElementById('finalScore').textContent = this.score;
      document.getElementById('gameOverOverlay').classList.remove('hidden');
      return;
    }

    if (this.shotsSinceRow >= SHOTS_PER_ROW) {
      this.shotsSinceRow = 0;
      this.board.shiftDown();
      if (this.board.checkGameOver()) {
        this.state = 'GAME_OVER';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
        return;
      }
    }

    if (this.board.isEmpty()) {
      this.level++;
      this.board.generateInitial();
      this.shotsSinceRow = 0;
      this.updateUI();
    }

    this.state = 'AIMING';
  }

  updateDyingBubbles() {
    for (let i = this.dyingBubbles.length - 1; i >= 0; i--) {
      const b = this.dyingBubbles[i];
      b.radius -= b.maxRadius * 0.06;
      if (b.radius <= 0) {
        this.dyingBubbles.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.clear();
    this.renderer.drawBackground();

    if (this.board) {
      this.renderer.drawGrid(this.board);
    }

    if (this.shooter) {
      if (this.aimPos && this.state === 'AIMING') {
        this.shooter.drawTrajectory(this.ctx, this.canvas.width);
      }
      this.renderer.drawShooter(this.shooter);
    }

    if (this.flyingBubble && this.state === 'SHOOTING') {
      this.renderer.drawBubble(
        this.flyingBubble.x,
        this.flyingBubble.y,
        this.board.bubbleRadius,
        this.flyingBubble.color
      );
    }

    for (const b of this.dyingBubbles) {
      this.renderer.drawShrinkingBubble(b.x, b.y, b.radius, b.color, b.maxRadius);
    }

    if (this.particles.length > 0) {
      this.renderer.drawParticles(this.particles);
    }

    if (this.shooter) {
      const preview = document.getElementById('nextBubble');
      if (preview && this.shooter.next !== null && this.shooter.next !== undefined) {
        preview.style.background = COLORS[this.shooter.next];
      }
    }
  }

  updateUI() {
    const scoreEl = document.getElementById('scoreDisplay');
    const levelEl = document.getElementById('levelDisplay');
    if (scoreEl) scoreEl.textContent = this.score;
    if (levelEl) levelEl.textContent = this.level;
  }

  loop() {
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.shotsSinceRow = 0;
    this.particles = [];
    this.dyingBubbles = [];
    this.flyingBubble = null;
    this.aimPos = null;
    this.state = 'AIMING';

    const overlay = document.getElementById('gameOverOverlay');
    if (overlay) overlay.classList.add('hidden');

    this.board = new Board(this.canvas.width, this.canvas.height);
    this.board.generateInitial();

    const shootY = this.canvas.height - this.board.bubbleRadius * 3.5;
    this.shooter.x = this.canvas.width / 2;
    this.shooter.y = shootY;
    this.shooter.bubbleR = this.board.bubbleRadius;
    this.shooter.refill();

    this.updateUI();
  }
}
