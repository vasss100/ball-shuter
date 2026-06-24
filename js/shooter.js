import { COLORS, SHOOT_SPEED } from './constants.js';

export class Shooter {
  constructor(x, y, bubbleR) {
    this.x = x;
    this.y = y;
    this.bubbleR = bubbleR;
    this.angle = -Math.PI / 2;
    this.current = null;
    this.next = null;
  }

  refill() {
    this.current = this.next !== null ? this.next : Math.floor(Math.random() * COLORS.length);
    this.next = Math.floor(Math.random() * COLORS.length);
  }

  setAngle(angle) {
    this.angle = angle;
  }

  getTipPosition() {
    return {
      x: this.x + Math.cos(this.angle) * this.bubbleR * 1.8,
      y: this.y + Math.sin(this.angle) * this.bubbleR * 1.8,
    };
  }

  shoot() {
    const tip = this.getTipPosition();
    const color = this.current;
    this.refill();
    return {
      x: tip.x,
      y: tip.y,
      vx: Math.cos(this.angle) * SHOOT_SPEED,
      vy: Math.sin(this.angle) * SHOOT_SPEED,
      color: color,
    };
  }

  calculateTrajectory(canvasW) {
    const tip = this.getTipPosition();
    let x = tip.x;
    let y = tip.y;
    let dx = Math.cos(this.angle);
    let dy = Math.sin(this.angle);
    const step = Math.max(3, this.bubbleR * 0.15);
    const maxSteps = 300;
    let reflected = false;
    const points = [{ x, y }];

    for (let i = 0; i < maxSteps; i++) {
      x += dx * step;
      y += dy * step;

      if (y <= this.bubbleR) {
        points.push({ x, y: this.bubbleR });
        break;
      }

      if (!reflected) {
        if (x < this.bubbleR) {
          x = this.bubbleR;
          dx = -dx;
          reflected = true;
        } else if (x > canvasW - this.bubbleR) {
          x = canvasW - this.bubbleR;
          dx = -dx;
          reflected = true;
        }
      } else if (x < this.bubbleR || x > canvasW - this.bubbleR) {
        break;
      }

      points.push({ x, y });
    }

    return points;
  }

  drawTrajectory(ctx, canvasW) {
    const points = this.calculateTrajectory(canvasW);
    if (points.length < 2) return;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.10)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([8, 10]);
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);

    const dotSpacing = Math.max(1, Math.floor(points.length / 16));
    for (let i = 1; i < points.length; i += dotSpacing) {
      const t = i / points.length;
      const alpha = 0.4 * (1 - t * 0.5);
      const r = 2.5 * (1 - t * 0.4);

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, Math.max(r, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, r * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.15})`;
      ctx.fill();
    }

    ctx.restore();
  }
}
