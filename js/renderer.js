import { COLORS } from './constants.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = 0;
    this.h = 0;
    this.bgImage = null;
  }

  setBgImage(img) {
    this.bgImage = img;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  drawBackground() {
    const ctx = this.ctx;
    if (this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, this.w, this.h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, this.h);
      grad.addColorStop(0, '#0f0c29');
      grad.addColorStop(0.5, '#302b63');
      grad.addColorStop(1, '#24243e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  drawBubble(x, y, radius, colorIndex) {
    const ctx = this.ctx;
    const color = COLORS[colorIndex];

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    const grad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.35, radius * 0.1,
      x, y, radius
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const highlight = ctx.createRadialGradient(
      x - radius * 0.25, y - radius * 0.3, 0,
      x - radius * 0.25, y - radius * 0.3, radius * 0.4
    );
    highlight.addColorStop(0, 'rgba(255,255,255,0.5)');
    highlight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = highlight;
    ctx.fill();
  }

  drawGrid(board) {
    for (let r = 0; r < board.rows; r++) {
      const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
      for (let c = 0; c < maxC; c++) {
        const val = board.grid[r][c];
        if (val !== null && val !== undefined) {
          const pos = board.getHexPos(r, c);
          this.drawBubble(pos.x, pos.y, board.bubbleRadius, val);
        }
      }
    }
  }

  drawShooter(shooter) {
    const ctx = this.ctx;
    const tip = shooter.getTipPosition();

    ctx.save();
    ctx.translate(shooter.x, shooter.y);

    ctx.beginPath();
    ctx.arc(0, 0, shooter.bubbleR * 1.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.rotate(shooter.angle);

    const barrelLen = shooter.bubbleR * 1.6;
    const barrelW = shooter.bubbleR * 0.55;
    const bx = shooter.bubbleR * 0.3;
    const by = -barrelW / 2;
    const br = barrelW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(bx + br, by);
    ctx.lineTo(bx + barrelLen - br, by);
    ctx.arcTo(bx + barrelLen, by, bx + barrelLen, by + br, br);
    ctx.lineTo(bx + barrelLen, by + barrelW - br);
    ctx.arcTo(bx + barrelLen, by + barrelW, bx + barrelLen - br, by + barrelW, br);
    ctx.lineTo(bx + br, by + barrelW);
    ctx.arcTo(bx, by + barrelW, bx, by + barrelW - br, br);
    ctx.lineTo(bx, by + br);
    ctx.arcTo(bx, by, bx + br, by, br);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    if (shooter.current !== null && shooter.current !== undefined) {
      this.drawBubble(tip.x, tip.y, shooter.bubbleR, shooter.current);
    }
  }

  drawShrinkingBubble(x, y, radius, colorIndex, maxRadius) {
    if (radius <= 0) return;
    const ctx = this.ctx;
    const color = COLORS[colorIndex];
    const t = Math.max(0, radius / (maxRadius || radius));

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 * t + 4;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    const grad = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.35, radius * 0.1,
      x, y, radius
    );
    grad.addColorStop(0, `rgba(255,255,255,${0.55 * t})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${0.08 * t})`);
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 * t})`;
    ctx.lineWidth = 1.5 * t + 0.5;
    ctx.stroke();

    if (t > 0.5) {
      ctx.shadowBlur = 0;
      const flash = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      flash.addColorStop(0, 'rgba(255,255,255,0.15)');
      flash.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = flash;
      ctx.fill();
    }

    ctx.restore();
  }

  drawParticles(particles) {
    const ctx = this.ctx;
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = p.life;
      const color = p.color >= 0 ? COLORS[p.color] : '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (p.life > 0.3) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = p.life * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
