export function createExplosion(x, y, colorIndex, bubbleRadius) {
  const count = 8 + Math.floor(Math.random() * 3);
  const particles = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      r: bubbleRadius * (0.08 + Math.random() * 0.18),
      baseR: bubbleRadius * (0.08 + Math.random() * 0.18),
      color: colorIndex,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
    });
  }

  return particles;
}

export function createFlashParticles(x, y, count, bubbleRadius) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * bubbleRadius * 0.15;
    particles.push({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      r: bubbleRadius * 0.6 * (0.5 + Math.random() * 0.5),
      baseR: bubbleRadius * 0.6 * (0.5 + Math.random() * 0.5),
      color: -1,
      life: 1,
      decay: 0.04 + Math.random() * 0.03,
    });
  }
  return particles;
}

export function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.07;
    p.vx *= 0.97;
    p.life -= p.decay;
    p.r = p.baseR * p.life;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}
