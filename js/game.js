(() => {
  'use strict';

  const GW = 540, GH = 960;

  const COLORS = [0x4a90d9, 0x4caf50, 0x9c27b0, 0xf44336, 0xffeb3b];
  const BUBBLE_KEYS = ['blue_bubble', 'green_bubble', 'purple_bubble', 'red_bubble', 'yellow_bubble'];

  const A = {
    BG: 'backgraund.jpg',
    METER_IMG: 'asets/new image/Gemini_Generated_Image_a76ulba76ulba76u.png',
    CANNON_IMG: 'asets/new image/Gemini_Generated_Image_k3tv0xk3tv0xk3tv.png',
    PLAY: 'asets/new image/play.png',
    BACK: 'asets/new image/back.png',
    SETTINGS: 'asets/new image/setting.png',
    PAUSE: 'asets/new image/puss .png',
    BUB: {
      blue_bubble: 'asets/new image/blue boll.png',
      green_bubble: 'asets/new image/green boll.png',
      purple_bubble: 'asets/new image/pulpul boll.png',
      red_bubble: 'asets/new image/red boll.png',
      yellow_bubble: 'asets/new image/yelloboll.png',
      colorful_bubble: 'asets/new image/colorfull boll.png',
    },
  };

  const CFG = {
    COLS: 8, ROWS: 14, FILL_ROWS: 5,
    SPEED: 18, SHOTS_PER_SHIFT: 7,
    NUM_COLORS: 5, COLOR_AIR: 6, COLOR_SPEC: 5,
    SPECIAL_RATE: 0.12, AIR_RATE: 0.08,
    POP_PTS: 10, FLOAT_PTS: 25, LVL_PTS: 500,
  };

  let app, mode = 'menu';
  let score = 0, level = 1, shots = 0, lastShift = 0;
  let bR, hW, hH, gX, gY, wallL, wallR;
  let grid = [];
  let cannonSpr, cannonAng;
  let bullet = null;
  let sparkles = [], falls = [];
  let ready = true, nextCol;
  let pX = GW / 2, pY = GH / 2;
  let scoreLabel, levelLabel, meterImg, meterMask, pctLabel;
  let pTex;

  let bgLayer, gameLayer, menuLayer;
  let gridL, bulletL, fxL, trajL, hudL;

  const rand = () => Math.random();
  const randInt = (n) => Math.floor(rand() * n);

  const randCol = () => {
    const r = rand();
    if (r < CFG.AIR_RATE) return CFG.COLOR_AIR;
    if (r < CFG.AIR_RATE + CFG.SPECIAL_RATE) return CFG.COLOR_SPEC;
    return randInt(CFG.NUM_COLORS);
  };

  const colFrame = (c) => {
    if (c >= 0 && c < CFG.NUM_COLORS) return BUBBLE_KEYS[c];
    if (c === CFG.COLOR_SPEC) return 'colorful_bubble';
    return null;
  };

  const hexNeighbors = (r, c) => {
    const d = r % 2 === 0
      ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
      : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
    return d
      .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
      .filter(({ r: nr, c: nc }) => nr >= 0 && nr < CFG.ROWS && nc >= 0 && nc < CFG.COLS);
  };

  const cellPos = (r, c) => ({
    x: gX + c * hW + (r % 2 === 1 ? hW / 2 : 0),
    y: gY + r * hH,
  });

  const pixelToCell = (px, py) => {
    const r = Math.round((py - gY) / hH);
    const off = r % 2 === 1 ? hW / 2 : 0;
    const c = Math.round((px - gX - off) / hW);
    return {
      r: Math.max(0, Math.min(CFG.ROWS - 1, r)),
      c: Math.max(0, Math.min(CFG.COLS - 1, c)),
    };
  };

  const bestSlot = (px, py) => {
    const a = pixelToCell(px, py);
    const pool = [a, ...hexNeighbors(a.r, a.c)];
    let best = null, bd = Infinity;
    for (const o of pool) {
      if (grid[o.r][o.c] !== null) continue;
      const p = cellPos(o.r, o.c);
      const d = Math.hypot(px - p.x, py - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  };

  const colorsMatch = (a, b) => {
    if (a == null || b == null) return false;
    if (a === CFG.COLOR_AIR || b === CFG.COLOR_AIR) return false;
    if (a === CFG.COLOR_SPEC || b === CFG.COLOR_SPEC) return true;
    return a === b;
  };

  const floodFill = (sr, sc) => {
    const root = grid[sr][sc];
    if (root == null || root === CFG.COLOR_AIR) return [];
    const seen = new Set();
    const out = [];
    const q = [{ r: sr, c: sc }];
    while (q.length) {
      const { r, c } = q.shift();
      const k = r * CFG.COLS + c;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ r, c });
      for (const n of hexNeighbors(r, c)) {
        const nk = n.r * CFG.COLS + n.c;
        if (!seen.has(nk) && grid[n.r][n.c] != null && colorsMatch(grid[n.r][n.c], root)) {
          q.push(n);
        }
      }
    }
    return out;
  };

  const findOrphans = () => {
    const reached = new Set();
    const q = [];
    for (let c = 0; c < CFG.COLS; c++) {
      if (grid[0][c] != null) {
        reached.add(c);
        q.push({ r: 0, c });
      }
    }
    while (q.length) {
      const cur = q.shift();
      for (const n of hexNeighbors(cur.r, cur.c)) {
        const k = n.r * CFG.COLS + n.c;
        if (reached.has(k)) continue;
        if (grid[n.r][n.c] == null) continue;
        reached.add(k);
        q.push(n);
      }
    }
    const orphans = [];
    for (let r = 0; r < CFG.ROWS; r++)
      for (let c = 0; c < CFG.COLS; c++)
        if (grid[r][c] != null && !reached.has(r * CFG.COLS + c))
          orphans.push({ r, c });
    return orphans;
  };

  function wipeContainer(ct) {
    while (ct.children.length > 0) {
      const kid = ct.children[0];
      ct.removeChild(kid);
      if (kid.destroy) kid.destroy();
    }
  }

  function layoutGrid() {
    const pad = 15;
    const usable = GW - pad * 2;
    bR = usable / (Math.sqrt(3) * (CFG.COLS - 0.5) + 1.5);
    hW = Math.sqrt(3) * bR;
    hH = bR * 1.5;
    const totalW = hW * (CFG.COLS - 1) + 2 * bR;
    gX = (GW - totalW) / 2;
    gY = 70;
    wallL = gX;
    wallR = gX + hW * (CFG.COLS - 1) + 2 * bR;
  }

  function fillGrid() {
    grid = [];
    for (let r = 0; r < CFG.ROWS; r++) {
      grid.push(Array.from({ length: CFG.COLS }, (_, c) => r < CFG.FILL_ROWS ? randCol() : null));
    }
  }

  function drawGrid() {
    wipeContainer(gridL);
    const sz = bR * 2;
    for (let r = 0; r < CFG.ROWS; r++) {
      for (let c = 0; c < CFG.COLS; c++) {
        const v = grid[r][c];
        if (v == null) continue;
        const f = colFrame(v);
        if (!f) continue;
        const p = cellPos(r, c);
        const s = PIXI.Sprite.from(f);
        s.anchor.set(0.5);
        s.x = p.x; s.y = p.y;
        s.width = sz; s.height = sz;
        gridL.addChild(s);
      }
    }
  }

  function shiftRows() {
    if (mode !== 'playing') return;
    for (let c = 0; c < CFG.COLS; c++)
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
    for (let r = CFG.ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
    grid[0] = Array.from({ length: CFG.COLS }, () => randCol());
    drawGrid();
    for (let c = 0; c < CFG.COLS; c++)
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
  }

  function setupCannon() {
    if (cannonSpr) cannonSpr.destroy();
    cannonSpr = PIXI.Sprite.from(A.CANNON_IMG);
    cannonSpr.anchor.set(0.5);
    cannonSpr.x = GW / 2;
    cannonSpr.y = GH - 70;
    const sz = bR * 2.6;
    cannonSpr.width = sz; cannonSpr.height = sz;
    cannonSpr.rotation = -Math.PI / 2;

    const base = new PIXI.Graphics();
    base.beginFill(0x111133, 0.9);
    base.drawCircle(0, 0, 24);
    base.endFill();
    base.lineStyle(2, 0x4488ff, 0.5);
    base.drawCircle(0, 0, 24);
    base.x = cannonSpr.x; base.y = cannonSpr.y;

    hudL.addChild(base);
    hudL.addChild(cannonSpr);
  }

  function aimCannon() {
    if (!cannonSpr || mode !== 'playing') return;
    const dx = pX - cannonSpr.x;
    const dy = pY - cannonSpr.y;
    let a = Math.atan2(dy, dx);
    a = Math.max(-Math.PI + 0.1, Math.min(-0.1, a));
    cannonAng = a;
    cannonSpr.rotation = a;
  }

  function drawTrajectory() {
    wipeContainer(trajL);
    if (mode !== 'playing' || !cannonSpr) return;
    let cx = cannonSpr.x, cy = cannonSpr.y;
    let vx = Math.cos(cannonAng), vy = Math.sin(cannonAng);
    const step = 8, limit = 180;
    const pts = [];
    for (let i = 0; i < limit; i++) {
      cx += vx * step; cy += vy * step;
      if (cx < wallL) { cx = wallL + (wallL - cx); vx = -vx; }
      else if (cx > wallR) { cx = wallR - (cx - wallR); vx = -vx; }
      if (cy < gY - bR) break;
      const approx = pixelToCell(cx, cy);
      let hit = false;
      for (const n of hexNeighbors(approx.r, approx.c)) {
        if (grid[n.r][n.c] == null) continue;
        const p = cellPos(n.r, n.c);
        if (Math.hypot(cx - p.x, cy - p.y) < hW * 0.75) { hit = true; break; }
      }
      if (hit) break;
      pts.push({ x: cx, y: cy });
    }
    for (let i = 0; i < pts.length; i++) {
      const a = 0.15 + 0.6 * (1 - i / pts.length);
      const rad = 1.2 + (1 - i / pts.length) * 2;
      const dot = new PIXI.Graphics();
      dot.beginFill(0x88ccff, a);
      dot.drawCircle(pts[i].x, pts[i].y, rad);
      dot.endFill();
      trajL.addChild(dot);
    }
  }

  function shoot() {
    if (mode !== 'playing' || !cannonSpr || !ready || bullet) return;
    ready = false;
    const a = cannonAng;
    bullet = {
      x: cannonSpr.x + Math.cos(a) * 30,
      y: cannonSpr.y + Math.sin(a) * 30,
      vx: Math.cos(a) * CFG.SPEED,
      vy: Math.sin(a) * CFG.SPEED,
      col: nextCol, active: true,
    };
    const f = colFrame(bullet.col);
    if (f) {
      const sz = bR * 2;
      bullet.spr = PIXI.Sprite.from(f);
      bullet.spr.anchor.set(0.5);
      bullet.spr.x = bullet.x; bullet.spr.y = bullet.y;
      bullet.spr.width = sz; bullet.spr.height = sz;
      bulletL.addChild(bullet.spr);
    }
    shots++;
    nextCol = randCol();
    showNext();
    refreshHUD();
  }

  function landBullet() {
    if (!bullet) { ready = true; return; }
    const slot = bestSlot(bullet.x, bullet.y);
    if (!slot) {
      if (bullet.spr) { bulletL.removeChild(bullet.spr); bullet.spr.destroy(); }
      bullet = null; ready = true; return;
    }
    const pos = cellPos(slot.r, slot.c);
    if (bullet.spr) {
      bulletL.removeChild(bullet.spr);
      bullet.spr.destroy();
    }
    grid[slot.r][slot.c] = bullet.col;
    const f = colFrame(bullet.col);
    if (f) {
      const sz = bR * 2;
      const ns = PIXI.Sprite.from(f);
      ns.anchor.set(0.5);
      ns.x = pos.x; ns.y = pos.y;
      ns.width = sz; ns.height = sz;
      gridL.addChild(ns);
    }
    bullet = null;
    ready = true;
    resolveMatch(slot.r, slot.c);
    if (shots > 0 && shots % CFG.SHOTS_PER_SHIFT === 0 && shots !== lastShift) {
      shiftRows();
      lastShift = shots;
    }
  }

  function resolveMatch(r, c) {
    const matched = floodFill(r, c);
    if (matched.length >= 3) {
      burstBubbles(matched);
      drawGrid();
      checkDead();
    }
    refreshHUD();
  }

  function burstBubbles(list) {
    for (const o of list) {
      const p = cellPos(o.r, o.c);
      emitSparkles(p.x, p.y, grid[o.r][o.c]);
      grid[o.r][o.c] = null;
    }
    score += list.length * CFG.POP_PTS;
    const orphans = findOrphans();
    for (const o of orphans) {
      const p = cellPos(o.r, o.c);
      emitSparkles(p.x, p.y, grid[o.r][o.c]);
      emitFall(p.x, p.y, grid[o.r][o.c]);
      grid[o.r][o.c] = null;
      score += CFG.FLOAT_PTS;
    }
    let clear = true;
    for (let r = 0; r < CFG.ROWS && clear; r++)
      for (let c = 0; c < CFG.COLS && clear; c++)
        if (grid[r][c] !== null) clear = false;
    if (clear) { level++; fillGrid(); drawGrid(); }
  }

  function emitSparkles(x, y, col) {
    if (!pTex) return;
    const n = Math.min(10, 300 - sparkles.length);
    const tint = COLORS[col] || 0xffffff;
    for (let i = 0; i < n; i++) {
      const s = new PIXI.Sprite(pTex);
      s.anchor.set(0.5);
      s.x = x + (rand() - 0.5) * 12;
      s.y = y + (rand() - 0.5) * 12;
      s.tint = tint;
      s.alpha = 1;
      s.scale.set(0.2 + rand() * 0.5);
      s.rotation = rand() * Math.PI * 2;
      fxL.addChild(s);
      sparkles.push({
        spr: s,
        vx: (rand() - 0.5) * 10,
        vy: -2 - rand() * 5,
        vr: (rand() - 0.5) * 0.3,
        life: 1,
        fade: 0.018 + rand() * 0.02,
      });
    }
  }

  function emitFall(x, y, col) {
    const f = colFrame(col);
    if (!f) return;
    const sz = bR * 2;
    const s = PIXI.Sprite.from(f);
    s.anchor.set(0.5);
    s.x = x; s.y = y;
    s.width = sz; s.height = sz;
    fxL.addChild(s);
    falls.push({
      spr: s, sz,
      vx: (rand() - 0.5) * 4,
      vy: 1 + rand() * 3,
      vr: (rand() - 0.5) * 0.1,
      life: 1,
      fade: 0.01 + rand() * 0.008,
    });
  }

  function checkDead() {
    for (let c = 0; c < CFG.COLS; c++)
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
  }

  function tickBullets(dt) {
    if (!bullet || !bullet.active) return;
    const b = bullet;
    const steps = 3;
    for (let s = 0; s < steps; s++) {
      b.x += b.vx * (dt / steps);
      b.y += b.vy * (dt / steps);
      if (b.x < wallL) { b.x = wallL + (wallL - b.x); b.vx = -b.vx; }
      else if (b.x > wallR) { b.x = wallR - (b.x - wallR); b.vx = -b.vx; }
      if (b.y < gY - bR) { landBullet(); return; }
      const approx = pixelToCell(b.x, b.y);
      let hit = false;
      for (const n of hexNeighbors(approx.r, approx.c)) {
        if (grid[n.r][n.c] == null) continue;
        const p = cellPos(n.r, n.c);
        if (Math.hypot(b.x - p.x, b.y - p.y) < hW * 0.75) { hit = true; break; }
      }
      if (hit) { landBullet(); return; }
    }
    if (b.spr) { b.spr.x = b.x; b.spr.y = b.y; b.spr.rotation += 0.05 * dt; }
  }

  function tickSparkles(dt) {
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const p = sparkles[i];
      p.spr.x += p.vx * dt;
      p.spr.y += p.vy * dt;
      p.spr.rotation += p.vr * dt;
      p.vy += 0.18 * dt;
      p.life -= p.fade * dt;
      p.spr.alpha = Math.max(0, p.life);
      p.spr.scale.set(Math.max(0, p.life * 0.5));
      if (p.life <= 0) {
        fxL.removeChild(p.spr);
        p.spr.destroy();
        sparkles.splice(i, 1);
      }
    }
  }

  function tickFalls(dt) {
    for (let i = falls.length - 1; i >= 0; i--) {
      const f = falls[i];
      f.spr.x += f.vx * dt;
      f.spr.y += f.vy * dt;
      f.spr.rotation += f.vr * dt;
      f.vy += 0.22 * dt;
      f.life -= f.fade * dt;
      f.spr.alpha = Math.max(0, f.life);
      const sc = f.life * f.sz;
      f.spr.width = Math.max(0, sc);
      f.spr.height = Math.max(0, sc);
      if (f.life <= 0) {
        fxL.removeChild(f.spr);
        f.spr.destroy();
        falls.splice(i, 1);
      }
    }
  }

  function buildHUD() {
    const bar = new PIXI.Graphics();
    bar.beginFill(0x000000, 0.55);
    bar.drawRoundedRect(0, 0, GW, 46, 0);
    bar.endFill();
    hudL.addChild(bar);

    scoreLabel = new PIXI.Text('Score: 0', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 18,
      fill: '#ffffff', fontWeight: 'bold',
      dropShadow: true, dropShadowColor: '#000000',
      dropShadowBlur: 3, dropShadowDistance: 1,
    });
    scoreLabel.x = 10; scoreLabel.y = 12;
    hudL.addChild(scoreLabel);

    levelLabel = new PIXI.Text('Level 1', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 16,
      fill: '#ffd700', fontWeight: 'bold',
      dropShadow: true, dropShadowColor: '#000000',
      dropShadowBlur: 2, dropShadowDistance: 1,
    });
    levelLabel.anchor.set(0.5, 0);
    levelLabel.x = GW / 2; levelLabel.y = 14;
    hudL.addChild(levelLabel);

    const mWrap = new PIXI.Container();
    mWrap.x = 10; mWrap.y = 48;

    meterImg = PIXI.Sprite.from(A.METER_IMG);
    meterImg.x = 4; meterImg.y = 4;
    meterImg.width = 142; meterImg.height = 18;

    meterMask = new PIXI.Graphics();
    meterMask.beginFill(0xffffff);
    meterMask.drawRect(0, 0, 0, 18);
    meterMask.endFill();
    meterMask.x = 4; meterMask.y = 4;
    meterImg.mask = meterMask;

    mWrap.addChild(meterImg);
    mWrap.addChild(meterMask);

    pctLabel = new PIXI.Text('0%', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 11,
      fill: '#ffffff', fontWeight: 'bold',
    });
    pctLabel.x = 154; pctLabel.y = 4;
    mWrap.addChild(pctLabel);
    hudL.addChild(mWrap);
  }

  function refreshHUD() {
    if (scoreLabel) scoreLabel.text = 'Score: ' + score;
    if (levelLabel) levelLabel.text = 'Level ' + level;
    if (meterMask) {
      const pct = Math.min(1, score / (level * CFG.LVL_PTS));
      meterMask.clear();
      meterMask.beginFill(0xffffff);
      meterMask.drawRect(4, 4, 142 * pct, 18);
      meterMask.endFill();
      if (pctLabel) pctLabel.text = Math.floor(pct * 100) + '%';
    }
  }

  function showNext() {
    const old = hudL.getChildByName('nxt', true);
    if (old) { hudL.removeChild(old); old.destroy(); }
    const f = colFrame(nextCol);
    if (!f) return;
    const s = PIXI.Sprite.from(f);
    s.name = 'nxt';
    s.anchor.set(0.5);
    const sz = bR * 0.6;
    s.width = sz; s.height = sz;
    s.x = GW - 28; s.y = 20;
    hudL.addChild(s);
  }

  function showGameOver() {
    if (mode === 'gameover') return;
    mode = 'gameover';
    bullet = null; ready = true;

    const ov = new PIXI.Container();

    const dim = new PIXI.Graphics();
    dim.beginFill(0x000000, 0.8);
    dim.drawRect(0, 0, GW, GH);
    dim.endFill();
    ov.addChild(dim);

    const title = new PIXI.Text('GAME OVER', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 52,
      fill: '#ff3333', fontWeight: '900',
      dropShadow: true, dropShadowColor: '#000000',
      dropShadowBlur: 10, dropShadowDistance: 4,
    });
    title.anchor.set(0.5);
    title.x = GW / 2; title.y = GH * 0.28;
    ov.addChild(title);

    const sTxt = new PIXI.Text('Score: ' + score, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 30,
      fill: '#ffd700', fontWeight: 'bold',
    });
    sTxt.anchor.set(0.5);
    sTxt.x = GW / 2; sTxt.y = GH * 0.38;
    ov.addChild(sTxt);

    const lTxt = new PIXI.Text('Level ' + level, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 22,
      fill: '#ffffff', fontWeight: 'bold',
    });
    lTxt.anchor.set(0.5);
    lTxt.x = GW / 2; lTxt.y = GH * 0.44;
    ov.addChild(lTxt);

    const rBtn = PIXI.Sprite.from(A.PLAY);
    rBtn.anchor.set(0.5);
    rBtn.x = GW / 2; rBtn.y = GH * 0.56;
    rBtn.width = 130; rBtn.height = 50;
    rBtn.eventMode = 'static'; rBtn.cursor = 'pointer';
    rBtn.hitArea = new PIXI.Rectangle(-65, -25, 130, 50);
    rBtn.on('pointerdown', () => {
      gameLayer.removeChild(ov);
      ov.destroy({ children: true });
      startPlay();
    });
    ov.addChild(rBtn);

    const rLabel = new PIXI.Text('RETRY', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 18,
      fill: '#ffffff', fontWeight: 'bold',
    });
    rLabel.anchor.set(0.5);
    rLabel.x = GW / 2; rLabel.y = GH * 0.56;
    ov.addChild(rLabel);

    const mBtn = PIXI.Sprite.from(A.BACK);
    mBtn.anchor.set(0.5);
    mBtn.x = GW / 2; mBtn.y = GH * 0.66;
    mBtn.width = 60; mBtn.height = 60;
    mBtn.eventMode = 'static'; mBtn.cursor = 'pointer';
    mBtn.hitArea = new PIXI.Rectangle(-30, -30, 60, 60);
    mBtn.on('pointerdown', () => {
      gameLayer.removeChild(ov);
      ov.destroy({ children: true });
      goMenu();
    });
    ov.addChild(mBtn);

    gameLayer.addChild(ov);
  }

  function startPlay() {
    mode = 'playing';
    score = 0; level = 1; shots = 0; lastShift = 0;
    bullet = null; sparkles = []; falls = [];
    wipeContainer(gridL);
    wipeContainer(bulletL);
    wipeContainer(fxL);
    wipeContainer(trajL);
    wipeContainer(hudL);

    layoutGrid();
    fillGrid();
    drawGrid();
    setupCannon();
    buildHUD();
    ready = true;
    nextCol = randCol();
    showNext();
    refreshHUD();
  }

  function goMenu() {
    mode = 'menu';
    gameLayer.visible = false;
    menuLayer.visible = true;
  }

  function buildMenu() {
    wipeContainer(menuLayer);

    const title = new PIXI.Text('BUBBLE\nSHOOTER', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 52,
      fill: '#ffffff', fontWeight: '900', align: 'center',
      letterSpacing: 4,
      dropShadow: true, dropShadowColor: '#0066ff',
      dropShadowBlur: 12, dropShadowDistance: 0,
    });
    title.anchor.set(0.5);
    title.x = GW / 2; title.y = GH * 0.25;
    menuLayer.addChild(title);

    const playBtn = PIXI.Sprite.from(A.PLAY);
    playBtn.anchor.set(0.5);
    playBtn.x = GW / 2; playBtn.y = GH * 0.5;
    playBtn.width = 160; playBtn.height = 65;
    playBtn.eventMode = 'static'; playBtn.cursor = 'pointer';
    playBtn.hitArea = new PIXI.Rectangle(-80, -32, 160, 64);
    playBtn.on('pointerdown', startPlay);
    menuLayer.addChild(playBtn);

    const gear = PIXI.Sprite.from(A.SETTINGS);
    gear.anchor.set(0.5);
    gear.x = GW / 2; gear.y = GH * 0.62;
    gear.width = 55; gear.height = 55;
    gear.eventMode = 'static'; gear.cursor = 'pointer';
    gear.hitArea = new PIXI.Rectangle(-28, -28, 56, 56);
    gear.on('pointerdown', () => {});
    menuLayer.addChild(gear);

    const hint = new PIXI.Text('Click Play or Press "N"', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 15,
      fill: '#aaaacc', fontWeight: '300',
      dropShadow: true, dropShadowColor: '#000000', dropShadowBlur: 2,
    });
    hint.anchor.set(0.5);
    hint.x = GW / 2; hint.y = GH * 0.72;
    menuLayer.addChild(hint);

    menuLayer.visible = true;
  }

  const resize = () => {
    const el = document.getElementById('game-container');
    if (!el || !app) return;
    const s = Math.min(el.clientWidth / GW, el.clientHeight / GH);
    const w = Math.floor(GW * s), h = Math.floor(GH * s);
    app.view.style.cssText =
      'position:absolute;width:' + w + 'px;height:' + h + 'px;' +
      'left:' + Math.floor((el.clientWidth - w) / 2) + 'px;' +
      'top:' + Math.floor((el.clientHeight - h) / 2) + 'px';
  };

  function genTextures() {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff);
    g.drawCircle(0, 0, 8);
    g.endFill();
    pTex = app.renderer.generateTexture(g);
    g.destroy();
  }

  function gameLoop(dt) {
    if (mode === 'playing') {
      aimCannon();
      drawTrajectory();
      tickBullets(dt);
    }
    tickSparkles(dt);
    tickFalls(dt);
  }

  async function boot() {
    app = new PIXI.Application({
      width: GW, height: GH,
      backgroundColor: 0x080820,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    document.getElementById('game-container').appendChild(app.view);
    window.addEventListener('resize', resize);
    resize();

    const loading = new PIXI.Text('Loading...', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 32,
      fill: '#ffffff', fontWeight: 'bold',
    });
    loading.anchor.set(0.5);
    loading.x = GW / 2; loading.y = GH / 2;
    app.stage.addChild(loading);

    const tasks = [];
    for (const [key, src] of Object.entries(A.BUB)) {
      tasks.push(
        PIXI.Assets.load(src).then((t) => PIXI.Texture.addToCache(t, key))
      );
    }
    for (const src of [A.BG, A.METER_IMG, A.CANNON_IMG, A.PLAY, A.BACK, A.SETTINGS, A.PAUSE]) {
      tasks.push(PIXI.Assets.load(src).catch(() => {}));
    }
    await Promise.allSettled(tasks);

    if (loading.parent) loading.destroy();

    genTextures();

    bgLayer = new PIXI.Container();
    gameLayer = new PIXI.Container();
    gameLayer.visible = false;
    menuLayer = new PIXI.Container();

    app.stage.addChild(bgLayer);
    app.stage.addChild(gameLayer);
    app.stage.addChild(menuLayer);

    try {
      const bg = PIXI.Sprite.from(A.BG);
      bg.width = GW; bg.height = GH;
      bgLayer.addChild(bg);
    } catch (e) {
      const fb = new PIXI.Graphics();
      fb.beginFill(0x080820);
      fb.drawRect(0, 0, GW, GH);
      fb.endFill();
      bgLayer.addChild(fb);
    }

    gridL = new PIXI.Container();
    bulletL = new PIXI.Container();
    fxL = new PIXI.Container();
    trajL = new PIXI.Container();
    hudL = new PIXI.Container();

    gameLayer.addChild(gridL);
    gameLayer.addChild(fxL);
    gameLayer.addChild(bulletL);
    gameLayer.addChild(trajL);
    gameLayer.addChild(hudL);

    const ptr = new PIXI.Graphics();
    ptr.beginFill(0x000000, 0.001);
    ptr.drawRect(0, 0, GW, GH);
    ptr.endFill();
    ptr.eventMode = 'static';
    ptr.on('pointermove', (e) => { pX = e.global.x; pY = e.global.y; });
    ptr.on('pointerdown', () => { if (mode === 'playing') shoot(); });
    gameLayer.addChild(ptr);

    buildMenu();

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'n' && mode === 'menu') startPlay();
    });

    app.ticker.add((d) => gameLoop(d));
  }

  boot().catch(console.error);
})();
