import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  console.error('Canvas element not found');
} else {
  const game = new Game(canvas);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => game.resize(), 150);
  });
}
