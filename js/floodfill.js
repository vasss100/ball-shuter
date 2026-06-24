export function findConnected(board, row, col, minMatch = 3) {
  const target = board.grid[row]?.[col];
  if (target === null || target === undefined) return [];

  const visited = new Set();
  const matched = [];
  const queue = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const key = r + ',' + c;
    if (visited.has(key)) continue;
    visited.add(key);

    if (board.grid[r]?.[c] !== target) continue;
    matched.push([r, c]);

    for (const nb of board.getNeighbors(r, c)) {
      if (!visited.has(nb[0] + ',' + nb[1])) {
        queue.push(nb);
      }
    }
  }

  return matched.length >= minMatch ? matched : [];
}

export function findFloating(board) {
  const connected = new Set();
  const queue = [];

  const maxC0 = (0 % 2 === 1) ? board.cols - 1 : board.cols;
  for (let c = 0; c < maxC0; c++) {
    if (board.grid[0][c] !== null && board.grid[0][c] !== undefined) {
      queue.push([0, c]);
      connected.add('0,' + c);
    }
  }

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    for (const nb of board.getNeighbors(r, c)) {
      const key = nb[0] + ',' + nb[1];
      if (!connected.has(key) && board.grid[nb[0]]?.[nb[1]] !== null && board.grid[nb[0]]?.[nb[1]] !== undefined) {
        connected.add(key);
        queue.push(nb);
      }
    }
  }

  const floating = [];
  for (let r = 0; r < board.rows; r++) {
    const maxC = (r % 2 === 1) ? board.cols - 1 : board.cols;
    for (let c = 0; c < maxC; c++) {
      if (board.grid[r][c] !== null && board.grid[r][c] !== undefined && !connected.has(r + ',' + c)) {
        floating.push([r, c]);
      }
    }
  }

  return floating;
}
