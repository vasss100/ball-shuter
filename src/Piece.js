import * as PIXI from 'pixi.js';
import Matter from 'matter-js';
import { CELL_SIZE, COLORS } from './constants.js';

const BLOCK_TEXTURE_KEYS = [
  '1-removed-bg.png',
  '2-removed-bg.png',
  '3-removed-bg.png',
  '4-removed-bg.png',
];

export class Piece {
  constructor(shapeMatrix, colorIndex, grid, textures) {
    this.shapeMatrix = shapeMatrix;
    this.colorIndex = colorIndex;
    this.color = COLORS.cellOccupied[colorIndex % COLORS.cellOccupied.length];
    this.grid = grid;
    this.textures = textures || {};
    this.placed = false;
    this.dragging = false;
    this.dragOffset = { x: 0, y: 0 };

    this.rows = shapeMatrix.length;
    this.cols = shapeMatrix[0].length;

    this.container = new PIXI.Container();
    this.ghostContainer = new PIXI.Container();
    this.ghostContainer.alpha = 0.35;
    this.ghostContainer.visible = false;

    this._createGraphics();
    this._createGhost();
    this._createBody();
  }

  _getBlockTexture() {
    const key = BLOCK_TEXTURE_KEYS[this.colorIndex % BLOCK_TEXTURE_KEYS.length];
    return this.textures[key] || null;
  }

  _createGraphics() {
    const blockTex = this._getBlockTexture();

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.shapeMatrix[r][c]) continue;

        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        const inset = 2;
        const cell = new PIXI.Container();

        const g = new PIXI.Graphics();
        g.beginFill(this.color, 1);
        g.drawRoundedRect(x + inset, y + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2, 6);
        g.endFill();
        cell.addChild(g);

        if (blockTex) {
          const sprite = new PIXI.Sprite(blockTex);
          sprite.x = x + 2;
          sprite.y = y + 2;
          sprite.width = CELL_SIZE - 4;
          sprite.height = CELL_SIZE - 4;
          sprite.alpha = 0.5;
          cell.addChild(sprite);
        }

        this.container.addChild(cell);
      }
    }
  }

  _createGhost() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.shapeMatrix[r][c]) continue;

        const g = new PIXI.Graphics();
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        const inset = 2;

        g.lineStyle(2, 0xffffff, 0.6);
        g.drawRoundedRect(x + inset, y + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2, 6);

        this.ghostContainer.addChild(g);
      }
    }
  }

  _createBody() {
    const vertices = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.shapeMatrix[r][c]) continue;
        const hw = CELL_SIZE / 2 - 2;
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        vertices.push({ x: cx - hw, y: cy - hw }, { x: cx + hw, y: cy - hw },
                      { x: cx + hw, y: cy + hw }, { x: cx - hw, y: cy + hw });
      }
    }
    const centroid = Matter.Vertices.centre(vertices);
    const bodyVerts = vertices.map(v => ({ x: v.x - centroid.x, y: v.y - centroid.y }));
    try {
      this.body = Matter.Bodies.fromVertices(0, 0, bodyVerts, {
        isStatic: false, restitution: 0.1, friction: 0.1, frictionAir: 0.05,
      });
      if (this.body) { this.body.pieceRef = this; this.body.isSensor = true; }
    } catch (e) { this.body = null; }
  }

  setPosition(x, y) {
    this.container.x = x;
    this.container.y = y;
    if (this.body) {
      Matter.Body.setPosition(this.body, { x: x + this.visualWidth / 2, y: y + this.visualHeight / 2 });
    }
  }

  get visualWidth() { return this.cols * CELL_SIZE; }
  get visualHeight() { return this.rows * CELL_SIZE; }

  getCenter() {
    return {
      x: this.container.x + this.visualWidth / 2,
      y: this.container.y + this.visualHeight / 2,
    };
  }

  updateGhost(gridX, gridY, canPlace) {
    this.ghostContainer.removeChildren();

    if (gridX === null || gridY === null) {
      this.ghostContainer.visible = false;
      return;
    }

    const x = grid.x + gridY * CELL_SIZE;
    const y = grid.y + gridX * CELL_SIZE;

    const lineColor = canPlace ? 0x00ff00 : 0xff4444;
    const fillColor = canPlace ? 0x00ff00 : 0xff4444;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.shapeMatrix[r][c]) continue;

        const g = new PIXI.Graphics();
        const cx = x + c * CELL_SIZE;
        const cy = y + r * CELL_SIZE;
        const inset = 2;

        g.lineStyle(2, lineColor, 0.7);
        g.beginFill(fillColor, 0.15);
        g.drawRoundedRect(cx + inset, cy + inset, CELL_SIZE - inset * 2, CELL_SIZE - inset * 2, 6);
        g.endFill();

        this.ghostContainer.addChild(g);
      }
    }

    this.ghostContainer.visible = true;
  }

  hideGhost() {
    this.ghostContainer.visible = false;
  }

  hitTest(px, py) {
    const bx = this.container.x;
    const by = this.container.y;
    return px >= bx && px <= bx + this.visualWidth &&
           py >= by && py <= by + this.visualHeight;
  }

  findBestGridPosition() {
    const cx = this.container.x + this.visualWidth / 2;
    const cy = this.container.y + this.visualHeight / 2;

    let bestPos = null;
    let bestDist = Infinity;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!this.grid.canPlace(this.shapeMatrix, r, c, this.colorIndex)) continue;

        const gx = this.grid.x + c * CELL_SIZE;
        const gy = this.grid.y + r * CELL_SIZE;
        const gcx = gx + this.visualWidth / 2;
        const gcy = gy + this.visualHeight / 2;

        const dist = Math.sqrt((gcx - cx) ** 2 + (gcy - cy) ** 2);
        if (dist < bestDist) {
          bestDist = dist;
          bestPos = { row: r, col: c };
        }
      }
    }

    return bestPos;
  }
}
