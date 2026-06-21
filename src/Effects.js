import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class Effects {
  constructor(parentContainer) {
    this.container = new PIXI.Container();
    parentContainer.addChild(this.container);

    this.particles = [];
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.shakeIntensity = 0;
    this.shakeDecay = 0;
    this.rings = [];
    this.floatingTexts = [];
    this._timeoutIds = [];
  }

  _createParticleGraphic(color, size) {
    const g = new PIXI.Graphics();
    g.beginFill(color, 1);
    g.drawCircle(0, 0, size);
    g.endFill();
    return g;
  }

  emitParticles(x, y, color, count = 12, speed = 3, size = 3, life = 30) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const spd = speed * (0.4 + Math.random() * 0.9);
      const g = this._createParticleGraphic(color, size * (0.6 + Math.random() * 0.8));
      g.x = x;
      g.y = y;
      this.container.addChild(g);
      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: life * (0.5 + Math.random() * 0.5),
        maxLife: life,
      });
    }
  }

  emitBurst(x, y, color, rings = 2) {
    for (let r = 0; r < rings; r++) {
      const id = setTimeout(() => {
        const ring = new PIXI.Graphics();
        ring.x = x;
        ring.y = y;
        this.container.addChild(ring);
        this.rings.push({
          graphic: ring,
          radius: 5,
          maxRadius: 60 + r * 30,
          color: color,
          alpha: 0.7,
        });
      }, r * 80);
      this._timeoutIds.push(id);
    }
    this.emitParticles(x, y, color, 20, 5, 4, 35);
  }

  emitLineClear(rows, cols, color, cellSize, offsetX, offsetY, gridSize) {
    for (const r of rows) {
      for (let c = 0; c < gridSize; c++) {
        const px = offsetX + c * cellSize + cellSize / 2;
        const py = offsetY + r * cellSize + cellSize / 2;
        this.emitParticles(px, py, color, 6, 2.5, 2.5, 20);
      }
    }
    for (const c of cols) {
      for (let r = 0; r < gridSize; r++) {
        if (!rows.includes(r)) {
          const px = offsetX + c * cellSize + cellSize / 2;
          const py = offsetY + r * cellSize + cellSize / 2;
          this.emitParticles(px, py, color, 6, 2.5, 2.5, 20);
        }
      }
    }
  }

  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDecay = intensity / duration;
  }

  showFloatingText(x, y, text, color, size = 24) {
    const t = new PIXI.Text(text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: size,
      fill: [color, 0xffffff],
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3,
    });
    t.anchor.set(0.5);
    t.x = x;
    t.y = y;
    t.alpha = 1;
    this.container.addChild(t);
    this.floatingTexts.push({ text: t, life: 40, vy: -2 });
  }

  levelUpCelebration() {
    const colors = [0x4FC3F7, 0x81C784, 0xFFD54F, 0xFF8A65, 0xBA68C8, 0xF06292, 0x4DD0E1];
    for (let i = 0; i < 8; i++) {
      const id = setTimeout(() => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const x = Math.random() * GAME_WIDTH;
        const y = Math.random() * GAME_HEIGHT * 0.6;
        this.emitParticles(x, y, color, 25, 6, 4, 40);
      }, i * 150);
      this._timeoutIds.push(id);
    }
    this.screenShake(6, 400);
  }

  clear() {
    for (const p of this.particles) {
      if (p.graphic.parent) this.container.removeChild(p.graphic);
      p.graphic.destroy();
    }
    for (const r of this.rings) {
      if (r.graphic.parent) this.container.removeChild(r.graphic);
      r.graphic.destroy();
    }
    for (const t of this.floatingTexts) {
      if (t.text.parent) this.container.removeChild(t.text);
      t.text.destroy();
    }
    for (const id of this._timeoutIds) clearTimeout(id);
    this._timeoutIds = [];
    this.particles = [];
    this.rings = [];
    this.floatingTexts = [];
    this.container.removeChildren();
  }

  update(delta) {
    const dt = delta || 1;

    // Screen shake
    if (this.shakeIntensity > 0.5) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      this.container.x = this.shakeOffsetX;
      this.container.y = this.shakeOffsetY;
      this.shakeIntensity -= this.shakeDecay * dt;
      if (this.shakeIntensity < 0) {
        this.shakeIntensity = 0;
        this.container.x = 0;
        this.container.y = 0;
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.15 * dt;
      p.life -= dt;
      p.graphic.x = p.x;
      p.graphic.y = p.y;
      const ratio = Math.max(0, p.life / p.maxLife);
      p.graphic.alpha = ratio;
      p.graphic.scale.set(ratio);
      if (p.life <= 0) {
        this.container.removeChild(p.graphic);
        p.graphic.destroy();
        this.particles.splice(i, 1);
      }
    }

    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += 2.5 * dt;
      r.alpha -= 0.025 * dt;
      r.graphic.clear();
      if (r.alpha > 0) {
        r.graphic.lineStyle(3, r.color, Math.max(0, r.alpha));
        r.graphic.drawCircle(0, 0, r.radius);
      }
      if (r.alpha <= 0 || r.radius > r.maxRadius) {
        this.container.removeChild(r.graphic);
        r.graphic.destroy();
        this.rings.splice(i, 1);
      }
    }

    // Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.text.y = ft.y;
      ft.life -= dt;
      ft.text.alpha = Math.max(0, ft.life / 40);
      if (ft.life <= 0) {
        this.container.removeChild(ft.text);
        ft.text.destroy();
        this.floatingTexts.splice(i, 1);
      }
    }
  }
}
