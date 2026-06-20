export const GRID_SIZE = 8;
export const CELL_SIZE = 64;
export const BOARD_PADDING = 10;
export const BOARD_OFFSET_X = 40;
export const BOARD_OFFSET_Y = 60;
export const PIECE_AREA_Y = 600;

export const COLORS = {
  background: 0x1a1a2e,
  cellEmpty: 0x2a2a4e,
  cellEmptyBorder: 0x3a3a5e,
  cellOccupied: [0x4FC3F7, 0x81C784, 0xFF8A65, 0xBA68C8, 0xF06292, 0xFFD54F, 0x4DD0E1, 0xAED581],
  gridBorder: 0x5a5a8e,
  ghost: 0xffffff,
  uiPanel: 0x16162a,
  uiText: 0xffffff,
  uiAccent: 0x4FC3F7,
};

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 800;

export const PIECE_SHAPES = [
  // 1x1
  { shape: [[1]], weight: 1 },
  // 1x2
  { shape: [[1, 1]], weight: 1 },
  // 2x1
  { shape: [[1], [1]], weight: 1 },
  // 1x3
  { shape: [[1, 1, 1]], weight: 2 },
  // 3x1
  { shape: [[1], [1], [1]], weight: 2 },
  // 2x2
  { shape: [[1, 1], [1, 1]], weight: 2 },
  // L-shape (bottom-right corner)
  { shape: [[1, 0], [1, 1]], weight: 2 },
  // L-shape (bottom-left corner)
  { shape: [[0, 1], [1, 1]], weight: 2 },
  // L-shape (top-right)
  { shape: [[1, 1], [1, 0]], weight: 2 },
  // L-shape (top-left)
  { shape: [[1, 1], [0, 1]], weight: 2 },
  // 1x4
  { shape: [[1, 1, 1, 1]], weight: 3 },
  // 4x1
  { shape: [[1], [1], [1], [1]], weight: 3 },
  // 2x3
  { shape: [[1, 1], [1, 1], [1, 1]], weight: 3 },
  // 3x2
  { shape: [[1, 1, 1], [1, 1, 1]], weight: 3 },
  // T-shape
  { shape: [[1, 1, 1], [0, 1, 0]], weight: 2 },
  // Z-shape
  { shape: [[1, 1, 0], [0, 1, 1]], weight: 2 },
  // S-shape
  { shape: [[0, 1, 1], [1, 1, 0]], weight: 2 },
];

export const NUM_PIECES_PER_TURN = 3;
