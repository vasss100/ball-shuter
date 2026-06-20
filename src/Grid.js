import * as PIXI from 'pixi.js';
import { GRID_SIZE, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y, COLORS } from './constants.js';

export class Grid {
  constructor() {
    this.cells = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    this.container = new PIXI.Container();
  }

  get x() { return BOARD_OFFSET_X; }
  get y() { return BOARD_OFFSET_Y; }
  get width() { return GRID_SIZE * CELL_SIZE; }
  get height() { return GRID_SIZE * CELL_SIZE; }

  canPlace(shape, row, col, colorIndex = null) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gr = row + r;
        const gc = col + c;
        if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
        if (this.cells[gr][gc] !== null) return false;
      }
    }
    return true;
  }

  placePiece(shape, row, col, colorIndex) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        this.cells[row + r][col + c] = colorIndex;
      }
    }
  }

  removePiece(shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        this.cells[row + r][col + c] = null;
      }
    }
  }

  getCompletedLines() {
    const rows = [];
    const cols = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (this.cells[r].every(c => c !== null)) rows.push(r);
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      if (this.cells.every(row => row[c] !== null)) cols.push(c);
    }

    return { rows, cols };
  }

  clearLines(rows, cols) {
    for (const r of rows) {
      for (let c = 0; c < GRID_SIZE; c++) {
        this.cells[r][c] = null;
      }
    }
    for (const c of cols) {
      for (let r = 0; r < GRID_SIZE; r++) {
        this.cells[r][c] = null;
      }
    }
    return rows.length + cols.length;
  }

  getCellPixelPos(row, col) {
    return {
      x: BOARD_OFFSET_X + col * CELL_SIZE,
      y: BOARD_OFFSET_Y + row * CELL_SIZE,
    };
  }

  pixelToGrid(pixelX, pixelY) {
    const col = Math.floor((pixelX - BOARD_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((pixelY - BOARD_OFFSET_Y) / CELL_SIZE);
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
    return { row, col };
  }

  hasAnyValidPlacement(pieces) {
    for (const piece of pieces) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (this.canPlace(piece.shapeMatrix, r, c)) return true;
        }
      }
    }
    return false;
  }

  countFilledCells() {
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (this.cells[r][c] !== null) count++;
      }
    }
    return count;
  }
}
