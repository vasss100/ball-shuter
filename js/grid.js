const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A78BFA',
  '#34D399',
  '#F97316',
];

const ROWS = 14;
const COLS = 8;

export class HexGrid {
  constructor(canvasW, canvasH) {
    this.cols = COLS;
    this.rows = ROWS;
    this.grid = [];
    this.configure(canvasW, canvasH);
  }

  configure(canvasW, canvasH) {
    const padX = canvasW * 0.04;
    const availW = canvasW - padX * 2;
    this.bubbleR = availW / (COLS * Math.sqrt(3) + Math.sqrt(3) / 2);
    const maxR = (canvasH * 0.72) / (ROWS * 1.5);
    if (this.bubbleR > maxR) this.bubbleR = maxR;
    this.hexW = Math.sqrt(3) * this.bubbleR;
    this.hexH = 2 * this.bubbleR;
    this.offsetX = (canvasW - COLS * this.hexW) / 2;
    this.offsetY = this.bubbleR * 1.5;
  }

  clear() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = null;
      }
    }
  }

  init(numRows = 5) {
    this.clear();
    for (let r = 0; r < Math.min(numRows, this.rows); r++) {
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        this.grid[r][c] = Math.floor(Math.random() * COLORS.length);
      }
    }
  }

  get(row, col) {
    if (row < 0 || row >= this.rows) return null;
    const maxC = row % 2 === 1 ? this.cols - 1 : this.cols;
    if (col < 0 || col >= maxC) return null;
    return this.grid[row][col];
  }

  set(row, col, value) {
    if (row < 0 || row >= this.rows) return;
    const maxC = row % 2 === 1 ? this.cols - 1 : this.cols;
    if (col < 0 || col >= maxC) return;
    this.grid[row][col] = value;
  }

  isEmpty(row, col) {
    return this.get(row, col) === null;
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
      const maxC = nr % 2 === 1 ? this.cols - 1 : this.cols;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < maxC) {
        nb.push([nr, nc]);
      }
    }
    return nb;
  }

  forEachCell(fn) {
    for (let r = 0; r < this.rows; r++) {
      const maxC = r % 2 === 1 ? this.cols - 1 : this.cols;
      for (let c = 0; c < maxC; c++) {
        fn(r, c, this.grid[r][c]);
      }
    }
  }

  drawBubble(ctx, x, y, radius, colorIndex) {
    const color = COLORS[colorIndex];

    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;
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

    ctx.restore();
  }

  drawGrid(ctx) {
    this.forEachCell((r, c, val) => {
      if (val !== null && val !== undefined) {
        const pos = this.getHexPos(r, c);
        this.drawBubble(ctx, pos.x, pos.y, this.bubbleR, val);
      }
    });
  }
}

export { COLORS, ROWS, COLS };
