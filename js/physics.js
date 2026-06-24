import { SHOOT_SPEED } from './constants.js';

export function createFlyingBubble(shooter) {
  const tip = shooter.getTipPosition();
  return {
    x: tip.x,
    y: tip.y,
    vx: Math.cos(shooter.angle) * SHOOT_SPEED,
    vy: Math.sin(shooter.angle) * SHOOT_SPEED,
    color: shooter.current,
  };
}

export function moveBubble(bubble, canvasWidth, bubbleRadius) {
  bubble.x += bubble.vx;
  bubble.y += bubble.vy;

  if (bubble.x < bubbleRadius) {
    bubble.x = bubbleRadius + (bubbleRadius - bubble.x);
    bubble.vx = Math.abs(bubble.vx);
    return true;
  }

  if (bubble.x > canvasWidth - bubbleRadius) {
    bubble.x = canvasWidth - bubbleRadius - (bubble.x - (canvasWidth - bubbleRadius));
    bubble.vx = -Math.abs(bubble.vx);
    return true;
  }

  return false;
}
