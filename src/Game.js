import * as PIXI from 'pixi.js';
import { Grid } from './Grid.js';
import { Piece } from './Piece.js';
import {
  GRID_SIZE, CELL_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  PIECE_AREA_Y, COLORS, GAME_WIDTH, GAME_HEIGHT,
  PIECE_SHAPES, NUM_PIECES_PER_TURN,
} from './constants.js';

export class Game {
  constructor(app) {
    this.app = app;
    this.state = 'menu';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('blockblast_highscore') || '0');
    this.grid = new Grid();
    this.pieces = [];
    this.activePieceIndex = -1;
    this.dragStart = { x: 0, y: 0 };
    this.isDragging = false;
    this.isGameOver = false;
    this.textures = {};

    this.container = new PIXI.Container();
    app.stage.addChild(this.container);

    this._createBackground();
    this._createGridUI();
    this._createUI();
    this._createMenu();
    this._createGameOver();
    this._setupInteraction();

    this._loadTextures();
  }

  _loadTextures() {
    const assets = [
      'grid_8x8_board-removed-bg.png',
      'ui_play_button-removed-bg.png',
      'IMG_20260620_222425-removed-bg.png',
      'IMG_20260620_222444-removed-bg.png',
      'IMG_20260620_222509-removed-bg.png',
      'IMG_20260620_222522-removed-bg.png',
    ];

    for (const name of assets) {
      const tex = PIXI.Texture.from(name);
      this.textures[name] = tex;
    }
  }

  _createBackground() {
    const bg = new PIXI.Graphics();
    bg.beginFill(COLORS.background);
    bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.endFill();
    this.container.addChild(bg);

    const boardTex = this.textures['grid_8x8_board-removed-bg.png'];
    if (boardTex) {
      const boardSprite = new PIXI.Sprite(boardTex);
      boardSprite.x = BOARD_OFFSET_X - 8;
      boardSprite.y = BOARD_OFFSET_Y - 8;
      boardSprite.width = GRID_SIZE * CELL_SIZE + 16;
      boardSprite.height = GRID_SIZE * CELL_SIZE + 16;
      boardSprite.alpha = 0.15;
      this.container.addChild(boardSprite);
    }
  }

  _createGridUI() {
    this.gridContainer = new PIXI.Container();
    this.container.addChild(this.gridContainer);

    const boardBg = new PIXI.Graphics();
    boardBg.beginFill(COLORS.boardBg, 0.8);
    boardBg.drawRoundedRect(
      BOARD_OFFSET_X - 4, BOARD_OFFSET_Y - 4,
      GRID_SIZE * CELL_SIZE + 8, GRID_SIZE * CELL_SIZE + 8,
      8
    );
    boardBg.endFill();
    this.gridContainer.addChild(boardBg);

    this.cellGraphics = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      this.cellGraphics[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        const g = new PIXI.Graphics();
        const x = BOARD_OFFSET_X + c * CELL_SIZE;
        const y = BOARD_OFFSET_Y + r * CELL_SIZE;
        g.lineStyle(1, COLORS.gridLine, 0.4);
        g.beginFill(COLORS.cellEmpty);
        g.drawRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
        g.endFill();
        this.gridContainer.addChild(g);
        this.cellGraphics[r][c] = g;
      }
    }

    const border = new PIXI.Graphics();
    border.lineStyle(2, COLORS.gridBorder, 0.8);
    border.drawRoundedRect(
      BOARD_OFFSET_X, BOARD_OFFSET_Y,
      GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE,
      6
    );
    this.gridContainer.addChild(border);
  }

  _createUI() {
    this.scoreText = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      fill: COLORS.titleColor,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2,
    });
    this.scoreText.x = BOARD_OFFSET_X;
    this.scoreText.y = 15;
    this.container.addChild(this.scoreText);

    this.highScoreText = new PIXI.Text(`Best: ${this.highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fill: COLORS.uiText,
    });
    this.highScoreText.alpha = 0.7;
    this.highScoreText.x = GAME_WIDTH - BOARD_OFFSET_X - 80;
    this.highScoreText.y = 18;
    this.container.addChild(this.highScoreText);

    this.restartBtn = new PIXI.Text('↻', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fill: COLORS.uiAccent,
    });
    this.restartBtn.x = GAME_WIDTH - 40;
    this.restartBtn.y = 12;
    this.restartBtn.eventMode = 'static';
    this.restartBtn.cursor = 'pointer';
    this.restartBtn.on('pointerdown', () => {
      if (this.state === 'playing' && !this.isGameOver) {
        if (confirm('Restart game? Your progress will be lost.')) {
          this.startGame();
        }
      }
    });
    this.container.addChild(this.restartBtn);

    this.piecesContainer = new PIXI.Container();
    this.container.addChild(this.piecesContainer);
  }

  _createMenu() {
    this.menuContainer = new PIXI.Container();
    this.menuContainer.visible = true;
    this.container.addChild(this.menuContainer);

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    this.menuContainer.addChild(overlay);

    const title = new PIXI.Text('BLOCK BLAST', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      fill: COLORS.titleColor,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4,
    });
    title.anchor.set(0.5);
    title.x = GAME_WIDTH / 2;
    title.y = GAME_HEIGHT / 2 - 100;
    this.menuContainer.addChild(title);

    const btnTex = this.textures['ui_play_button-removed-bg.png'];
    let playBtn;
    if (btnTex) {
      playBtn = new PIXI.Sprite(btnTex);
      playBtn.anchor.set(0.5);
      playBtn.scale.set(0.8);
    } else {
      playBtn = new PIXI.Graphics();
      playBtn.beginFill(COLORS.uiAccent);
      playBtn.drawRoundedRect(-70, -25, 140, 50, 12);
      playBtn.endFill();

      const playText = new PIXI.Text('PLAY', {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: 'bold',
      });
      playText.anchor.set(0.5);
      playBtn.addChild(playText);
    }
    playBtn.x = GAME_WIDTH / 2;
    playBtn.y = GAME_HEIGHT / 2 + 20;
    playBtn.eventMode = 'static';
    playBtn.cursor = 'pointer';
    this.menuContainer.addChild(playBtn);

    playBtn.on('pointerdown', () => this.startGame());
  }

  _createGameOver() {
    this.gameOverContainer = new PIXI.Container();
    this.gameOverContainer.visible = false;
    this.container.addChild(this.gameOverContainer);

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.7);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    this.gameOverContainer.addChild(overlay);

    const goTitle = new PIXI.Text('GAME OVER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 42,
      fill: 0xff4444,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4,
    });
    goTitle.anchor.set(0.5);
    goTitle.x = GAME_WIDTH / 2;
    goTitle.y = GAME_HEIGHT / 2 - 100;
    this.gameOverContainer.addChild(goTitle);

    this.finalScoreText = new PIXI.Text('Score: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 28,
      fill: 0xffffff,
    });
    this.finalScoreText.anchor.set(0.5);
    this.finalScoreText.x = GAME_WIDTH / 2;
    this.finalScoreText.y = GAME_HEIGHT / 2 - 40;
    this.gameOverContainer.addChild(this.finalScoreText);

    const retryBtn = new PIXI.Graphics();
    retryBtn.beginFill(COLORS.uiAccent);
    retryBtn.drawRoundedRect(-80, -25, 160, 50, 12);
    retryBtn.endFill();
    retryBtn.x = GAME_WIDTH / 2;
    retryBtn.y = GAME_HEIGHT / 2 + 40;
    retryBtn.eventMode = 'static';
    retryBtn.cursor = 'pointer';
    this.gameOverContainer.addChild(retryBtn);

    const retryText = new PIXI.Text('PLAY AGAIN', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 22,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    retryText.anchor.set(0.5);
    retryText.x = 0;
    retryText.y = 0;
    retryBtn.addChild(retryText);

    retryBtn.on('pointerdown', () => this.startGame());
  }

  _setupInteraction() {
    this.container.eventMode = 'static';
    this.container.hitArea = new PIXI.Rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.container.on('pointerdown', (e) => this._onPointerDown(e));
    this.container.on('pointermove', (e) => this._onPointerMove(e));
    this.container.on('pointerup', (e) => this._onPointerUp(e));
    this.container.on('pointerupoutside', (e) => this._onPointerUp(e));
  }

  _onPointerDown(e) {
    if (this.state !== 'playing' || this.isGameOver) return;

    const pos = e.global;

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (piece.placed) continue;
      if (piece.hitTest(pos.x, pos.y)) {
        this.activePieceIndex = i;
        this.isDragging = true;
        piece.dragging = true;

        this.dragStart.x = pos.x - piece.container.x;
        this.dragStart.y = pos.y - piece.container.y;

        this.piecesContainer.removeChild(piece.container);
        this.piecesContainer.addChild(piece.container);

        this.piecesContainer.addChild(piece.ghostContainer);
        break;
      }
    }
  }

  _onPointerMove(e) {
    if (!this.isDragging || this.activePieceIndex < 0) return;

    const piece = this.pieces[this.activePieceIndex];
    const pos = e.global;

    piece.container.x = pos.x - this.dragStart.x;
    piece.container.y = pos.y - this.dragStart.y;

    const cx = piece.container.x + piece.visualWidth / 2;
    const cy = piece.container.y + piece.visualHeight / 2;
    const gridPos = this.grid.pixelToGrid(cx, cy);

    if (gridPos) {
      const canPlace = this.grid.canPlace(piece.shapeMatrix, gridPos.row, gridPos.col, piece.colorIndex);
      piece.updateGhost(gridPos.row, gridPos.col, canPlace);
    } else {
      piece.hideGhost();
    }
  }

  _onPointerUp() {
    if (!this.isDragging || this.activePieceIndex < 0) return;

    const piece = this.pieces[this.activePieceIndex];
    piece.dragging = false;
    this.isDragging = false;

    piece.hideGhost();

    const bestPos = piece.findBestGridPosition();

    if (bestPos && this.grid.canPlace(piece.shapeMatrix, bestPos.row, bestPos.col, piece.colorIndex)) {
      this.grid.placePiece(piece.shapeMatrix, bestPos.row, bestPos.col, piece.colorIndex);

      const cx = BOARD_OFFSET_X + bestPos.col * CELL_SIZE;
      const cy = BOARD_OFFSET_Y + bestPos.row * CELL_SIZE;

      this.animatePiecePlace(piece, cx, cy);
      this._updateGridVisual();

      const cellsPlaced = piece.shapeMatrix.flat().filter(Boolean).length;
      this.score += cellsPlaced;

      const { rows, cols } = this.grid.getCompletedLines();
      if (rows.length > 0 || cols.length > 0) {
        const cleared = rows.length + cols.length;

        let lineScore = 0;
        for (let i = 1; i <= cleared; i++) {
          lineScore += i * 10;
        }
        this.score += lineScore;

        this.animateLineClear(rows, cols);
        this.grid.clearLines(rows, cols);
        this._updateGridVisual();
      }

      piece.placed = true;
      this.piecesContainer.removeChild(piece.container);
      this.piecesContainer.removeChild(piece.ghostContainer);

      const placedCount = this.pieces.filter(p => p.placed).length;
      if (placedCount === this.pieces.length) {
        this.spawnPieces();
      }

      this._updateScore();
    } else {
      this._returnPieceToSlot(piece);
    }

    this.activePieceIndex = -1;
  }

  animatePiecePlace(piece, targetX, targetY) {
    piece.setPosition(targetX, targetY);

    const g = new PIXI.Graphics();
    for (let r = 0; r < piece.rows; r++) {
      for (let c = 0; c < piece.cols; c++) {
        if (!piece.shapeMatrix[r][c]) continue;
        const x = targetX + c * CELL_SIZE;
        const y = targetY + r * CELL_SIZE;
        g.beginFill(piece.color, 0.6);
        g.drawRoundedRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
        g.endFill();
      }
    }
    g.alpha = 0;
    this.gridContainer.addChild(g);

    let frame = 0;
    const animate = () => {
      frame++;
      g.alpha = frame / 10;
      if (frame >= 10) {
        this.gridContainer.removeChild(g);
        return;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  animateLineClear(rows, cols) {
    const flashColor = 0xffffff;

    const flashCells = [];
    for (const r of rows) {
      for (let c = 0; c < GRID_SIZE; c++) {
        flashCells.push({ row: r, col: c });
      }
    }
    for (const c of cols) {
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!rows.includes(r)) flashCells.push({ row: r, col: c });
      }
    }

    for (const { row, col } of flashCells) {
      const g = new PIXI.Graphics();
      const x = BOARD_OFFSET_X + col * CELL_SIZE;
      const y = BOARD_OFFSET_Y + row * CELL_SIZE;
      g.beginFill(flashColor);
      g.drawRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
      g.endFill();
      g.alpha = 0;
      this.gridContainer.addChild(g);

      let frame = 0;
      const animate = () => {
        frame++;
        g.alpha = Math.sin(frame * 0.3) * 0.5 + 0.3;
        if (frame > 15) {
          this.gridContainer.removeChild(g);
          return;
        }
        requestAnimationFrame(animate);
      };
      animate();
    }
  }

  _returnPieceToSlot(piece) {
    if (this.isGameOver) return;
    const positions = this._getSlotPositions();
    const slotIndex = this.pieces.indexOf(piece);
    if (positions[slotIndex]) {
      piece.setPosition(positions[slotIndex].x, positions[slotIndex].y);
    }
  }

  _updateGridVisual() {
    const blockTexKeys = [
      'IMG_20260620_222425-removed-bg.png',
      'IMG_20260620_222444-removed-bg.png',
      'IMG_20260620_222509-removed-bg.png',
      'IMG_20260620_222522-removed-bg.png',
    ];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const g = this.cellGraphics[r][c];
        const val = this.grid.cells[r][c];
        g.clear();

        if (val !== null) {
          const color = COLORS.cellOccupied[val % COLORS.cellOccupied.length];
          const x = BOARD_OFFSET_X + c * CELL_SIZE;
          const y = BOARD_OFFSET_Y + r * CELL_SIZE;
          g.beginFill(color, 0.9);
          g.drawRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
          g.endFill();

          const texKey = blockTexKeys[val % blockTexKeys.length];
          const tex = this.textures[texKey];
          if (tex) {
            g.beginFill(0xffffff, 0.25);
            g.drawRoundedRect(x + 4, y + 4, CELL_SIZE - 10, (CELL_SIZE - 2) / 3, 3);
            g.endFill();
          } else {
            g.beginFill(0xffffff, 0.1);
            g.drawRoundedRect(x + 4, y + 4, CELL_SIZE - 10, (CELL_SIZE - 2) / 3, 3);
            g.endFill();
          }
        } else {
          const x = BOARD_OFFSET_X + c * CELL_SIZE;
          const y = BOARD_OFFSET_Y + r * CELL_SIZE;
          g.lineStyle(1, COLORS.gridLine, 0.4);
          g.beginFill(COLORS.cellEmpty);
          g.drawRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 3);
          g.endFill();
        }
      }
    }
  }

  _getSlotPositions() {
    const totalPieceWidth = this.pieces.reduce((w, p) => w + p.visualWidth, 0);
    const gap = Math.min(20, (GAME_WIDTH - totalPieceWidth) / (this.pieces.length + 1));
    const positions = [];
    let currentX = gap;
    for (let i = 0; i < this.pieces.length; i++) {
      positions.push({ x: currentX, y: PIECE_AREA_Y });
      currentX += this.pieces[i].visualWidth + gap;
    }
    return positions;
  }

  spawnPieces() {
    this.pieces = [];
    this.piecesContainer.removeChildren();

    const shuffled = [...PIECE_SHAPES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < NUM_PIECES_PER_TURN; i++) {
      const shapeDef = shuffled[i % shuffled.length];
      const colorIndex = Math.floor(Math.random() * COLORS.cellOccupied.length);
      const piece = new Piece(shapeDef.shape, colorIndex, this.grid, this.textures);
      this.pieces.push(piece);
    }

    const positions = this._getSlotPositions();
    for (let i = 0; i < this.pieces.length; i++) {
      this.pieces[i].setPosition(positions[i].x, positions[i].y);
      this.piecesContainer.addChild(this.pieces[i].container);
    }

    if (!this.grid.hasAnyValidPlacement(this.pieces)) {
      this.endGame();
    }
  }

  startGame() {
    this.state = 'playing';
    this.isGameOver = false;
    this.score = 0;
    this.menuContainer.visible = false;
    this.gameOverContainer.visible = false;

    this.grid.cells = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
    this._updateGridVisual();
    this._updateScore();

    this.pieces = [];
    this.piecesContainer.removeChildren();
    this.spawnPieces();
  }

  endGame() {
    this.isGameOver = true;
    this.state = 'gameover';

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('blockblast_highscore', String(this.highScore));
      this.highScoreText.text = `Best: ${this.highScore}`;
    }

    this.finalScoreText.text = `Score: ${this.score}`;
    this.gameOverContainer.visible = true;
  }

  _updateScore() {
    this.scoreText.text = `Score: ${this.score}`;
    this.scoreText.x = BOARD_OFFSET_X;
  }

  _updateFillCount() {
    const filled = this.grid.countFilledCells();
    const total = GRID_SIZE * GRID_SIZE;
  }

  restart() {
    this.startGame();
  }
}
