import { COLS, ROWS, COLORS, INITIAL_ROWS } from './constants.js';

export class Board {
  constructor(canvasW, canvasH) {
    this.grid = [];
    this.configure(canvasW, canvasH);
  }

  configure(canvasW, canvasH) {
    const padding = canvasW * 0.04;
    const availW = canvasW - padding * 2;
    this.bubbleRadius = availW / (COLS * Math.sqrt(3) + Math.sqrt(3) / 2);
    const maxR = (canvasH * 0.72) / (ROWS * 1.5);
    if (this.bubbleRadius > maxR) this.bubbleRadius = maxR;
    this.hexW = Math.sqrt(3) * this.bubbleRadius;
    this.hexH = 2 * this.bubbleRadius;
    this.offsetX = (canvasW - COLS * this.hexW) / 2;
    this.offsetY = this.bubbleRadius * 1.5;
    this.cols = COLS;
    this.rows = ROWS;
  }

  clear() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = null;
      }
    }
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
      const nr = row + dr;
      const nc = col + dc;
      const maxC = (nr % 2 === 1) ? this.cols - 1 : this.cols;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < maxC) {
        nb.push([nr, nc]);
      }
    }
    return nb;
  }

  generateInitial() {
    this.clear();
    for (let r = 0; r < INITIAL_ROWS; r++) {
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = Math.floor(Math.random() * COLORS.length);
      }
    }
  }

  removeBubbles(positions) {
    for (const [r, c] of positions) {
      this.grid[r][c] = null;
    }
  }

  checkGameOver() {
    const maxC = ((this.rows - 1) % 2 === 1) ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC; c++) {
      if (this.grid[this.rows - 1][c] !== null && this.grid[this.rows - 1][c] !== undefined) {
        return true;
      }
    }
    return false;
  }

  shiftDown() {
    for (let r = this.rows - 1; r > 0; r--) {
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        const prevMaxC = ((r - 1) % 2 === 1) ? this.cols - 1 : this.cols;
        if (c < prevMaxC) {
          this.grid[r][c] = this.grid[r - 1][c];
        } else {
          this.grid[r][c] = null;
        }
      }
    }
    const maxC0 = (0 % 2 === 1) ? this.cols - 1 : this.cols;
    for (let c = 0; c < maxC0; c++) {
      this.grid[0][c] = Math.floor(Math.random() * COLORS.length);
    }
  }

  isEmpty() {
    for (let r = 0; r < this.rows; r++) {
      const maxC = (r % 2 === 1) ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        if (this.grid[r][c] !== null && this.grid[r][c] !== undefined) return false;
      }
    }
    return true;
  }
}
