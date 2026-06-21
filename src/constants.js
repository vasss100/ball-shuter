export const GRID_SIZE = 8;
export const CELL_SIZE = 64;
export const BOARD_PADDING = 10;
export const BOARD_OFFSET_X = 40;
export const BOARD_OFFSET_Y = 60;
export const PIECE_AREA_Y = 600;

export const COLORS = {
  background: 0x1a1a2e,
  boardBg: 0x16213e,
  cellEmpty: 0x2d3a6b,
  cellEmptyBorder: 0x3d4a7b,
  cellOccupied: [0x4FC3F7, 0x81C784, 0xFF8A65, 0xBA68C8, 0xF06292, 0xFFD54F, 0x4DD0E1, 0xAED581],
  gridBorder: 0x7a8ac0,
  gridLine: 0x3d4a7b,
  ghost: 0xffffff,
  uiPanel: 0x0f3460,
  uiText: 0xffffff,
  uiAccent: 0x4FC3F7,
  uiAccentDark: 0x0d47a1,
  titleColor: 0x4FC3F7,
};

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 800;

export const MAX_LEVEL = 500;
export const NUM_PIECES_PER_TURN = 3;

const THEMES = [
  { background: 0x1a1a2e, boardBg: 0x16213e, accent: 0x4FC3F7, title: 'OCEAN' },
  { background: 0x1a2e1a, boardBg: 0x163e16, accent: 0x81C784, title: 'FOREST' },
  { background: 0x2e1a2e, boardBg: 0x3e163e, accent: 0xBA68C8, title: 'ROYAL' },
  { background: 0x2e1a1a, boardBg: 0x3e1616, accent: 0xFF8A65, title: 'RUBY' },
  { background: 0x2e2e1a, boardBg: 0x3e3e16, accent: 0xFFD54F, title: 'GOLD' },
  { background: 0x1a2e2e, boardBg: 0x163e3e, accent: 0x4DD0E1, title: 'TEAL' },
  { background: 0x2e1a2e, boardBg: 0x3e163e, accent: 0xF06292, title: 'ROSE' },
  { background: 0x1a2e1a, boardBg: 0x163e16, accent: 0xAED581, title: 'LIME' },
  { background: 0x1a1a2e, boardBg: 0x16213e, accent: 0x7E57C2, title: 'INDIGO' },
  { background: 0x2e2e2e, boardBg: 0x3e3e3e, accent: 0xE0E0E0, title: 'CRYSTAL' },
];

export function getTheme(level) {
  const idx = Math.min(Math.floor((level - 1) / 50), THEMES.length - 1);
  return THEMES[idx];
}

export function getScoreForLevel(level) {
  return level * 30 + 20;
}

const SHAPES_TIER1 = [
  { shape: [[1]], weight: 1 },
  { shape: [[1, 1]], weight: 1 },
  { shape: [[1], [1]], weight: 1 },
  { shape: [[1, 1, 1]], weight: 2 },
  { shape: [[1], [1], [1]], weight: 2 },
  { shape: [[1, 1], [1, 1]], weight: 2 },
  { shape: [[1, 0], [1, 1]], weight: 2 },
  { shape: [[0, 1], [1, 1]], weight: 2 },
  { shape: [[1, 1], [1, 0]], weight: 2 },
  { shape: [[1, 1], [0, 1]], weight: 2 },
];

const SHAPES_TIER2 = [
  ...SHAPES_TIER1,
  { shape: [[1, 1, 1, 1]], weight: 3 },
  { shape: [[1], [1], [1], [1]], weight: 3 },
  { shape: [[1, 1], [1, 1], [1, 1]], weight: 3 },
  { shape: [[1, 1, 1], [1, 1, 1]], weight: 3 },
  { shape: [[1, 1, 1], [0, 1, 0]], weight: 2 },
  { shape: [[1, 1, 0], [0, 1, 1]], weight: 2 },
  { shape: [[0, 1, 1], [1, 1, 0]], weight: 2 },
];

const SHAPES_TIER3 = [
  ...SHAPES_TIER2,
  { shape: [[1, 1, 1], [1, 0, 1]], weight: 3 },
  { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], weight: 3 },
  { shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], weight: 3 },
  { shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], weight: 3 },
  { shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], weight: 3 },
  { shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], weight: 3 },
  { shape: [[1, 1, 1, 1, 1]], weight: 4 },
  { shape: [[1], [1], [1], [1], [1]], weight: 4 },
  { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 4 },
];

const SHAPES_TIER4 = [
  ...SHAPES_TIER3,
  { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0], [0, 1, 0]], weight: 4 },
  { shape: [[1, 0, 1], [1, 1, 1], [1, 0, 1]], weight: 4 },
  { shape: [[1, 1, 1, 1], [1, 0, 0, 0]], weight: 4 },
  { shape: [[1, 0, 0, 0], [1, 1, 1, 1]], weight: 4 },
  { shape: [[1, 1, 1, 1], [0, 0, 0, 1]], weight: 4 },
  { shape: [[0, 0, 0, 1], [1, 1, 1, 1]], weight: 4 },
  { shape: [[1, 0, 0], [1, 1, 0], [0, 1, 1]], weight: 3 },
  { shape: [[0, 0, 1], [0, 1, 1], [1, 1, 0]], weight: 3 },
  { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 1]], weight: 3 },
  { shape: [[0, 1, 1], [1, 1, 0], [1, 0, 0]], weight: 3 },
  { shape: [[1, 1, 1], [1, 0, 1], [1, 1, 1]], weight: 4 },
  { shape: [[1, 1, 1, 1], [0, 1, 1, 0]], weight: 4 },
  { shape: [[0, 1, 1, 0], [1, 1, 1, 1]], weight: 4 },
];

export function getShapesForLevel(level) {
  if (level <= 100) return SHAPES_TIER1;
  if (level <= 200) return SHAPES_TIER2;
  if (level <= 300) return SHAPES_TIER3;
  if (level <= 400) return SHAPES_TIER4;
  return SHAPES_TIER4;
}
