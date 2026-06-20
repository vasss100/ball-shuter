import * as PIXI from 'pixi.js';
import Matter from 'matter-js';
import { Game } from './Game.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

const app = new PIXI.Application({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x1a1a2e,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.view);

const engine = Matter.Engine.create({
  gravity: { x: 0, y: 0 },
});

const game = new Game(app);

app.ticker.add(() => {
  Matter.Engine.update(engine, 1000 / 60);
});

window.addEventListener('resize', () => {
  const scaleX = window.innerWidth / GAME_WIDTH;
  const scaleY = window.innerHeight / GAME_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  app.view.style.width = `${GAME_WIDTH * scale}px`;
  app.view.style.height = `${GAME_HEIGHT * scale}px`;
});

window.dispatchEvent(new Event('resize'));
