export function checkGridCollision(bubble, board) {
  const threshold = board.bubbleRadius * 2;
  const thresholdSq = threshold * threshold;

  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] === null || board.grid[r][c] === undefined) continue;

      const pos = board.getHexPos(r, c);
      const dx = pos.x - bubble.x;
      const dy = pos.y - bubble.y;

      if (dx * dx + dy * dy < thresholdSq) {
        return { row: r, col: c };
      }
    }
  }

  return null;
}

export function findSnapPosition(bubble, board) {
  let best = null;
  let bestDistSq = Infinity;

  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null && board.grid[r][c] !== undefined) continue;

      const pos = board.getHexPos(r, c);
      const dx = pos.x - bubble.x;
      const dy = pos.y - bubble.y;
      const d = dx * dx + dy * dy;

      if (d < bestDistSq) {
        bestDistSq = d;
        best = { row: r, col: c };
      }
    }
  }

  return best;
}
