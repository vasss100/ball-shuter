(() => {
  'use strict';

  const W = 540, H = 960;

  const CFG = {
    COLS: 8, ROWS: 14, INITIAL_ROWS: 5,
    SHOOT_SPEED: 18,
    POP_SCORE: 10, FLOAT_SCORE: 25,
    SHOTS_PER_ROW: 7,
    NUM_COLORS: 5,
    COLOR_AIR: 5,
    COLOR_SPECIAL: 6,
    SPECIAL_CHANCE: 0.12,
    AIR_CHANCE: 0.08,
    BG_PATH: 'asets/new image/backgraund.jpg',
    PREMIUM_METER: 'asets/new image/Gemini_Generated_Image_k3tv0xk3tv0xk3tv.png',
    FRAME_ALIASES: {
      'blue_bubble': 'asets/new image/blue boll.png',
      'green_bubble': 'asets/new image/green boll.png',
      'purple_bubble': 'asets/new image/pulpul boll.png',
      'red_bubble': 'asets/new image/red boll.png',
      'yellow_bubble': 'asets/new image/yelloboll.png',
      'colorful_bubble': 'asets/new image/colorfull boll.png',
      'premium_play_btn': 'asets/new image/play.png',
    },
    BUBBLE_FRAMES: [
      'blue_bubble', 'green_bubble', 'purple_bubble',
      'red_bubble', 'yellow_bubble',
    ],
    FRAME_SPECIAL: 'colorful_bubble',
    FRAME_AIR: 'air_bubble',
    FRAME_CANNON: 'cannon_play',
    FRAME_SCORE_BAR: 'score_meter_bg',
    FRAME_PLAY_BTN: 'premium_play_btn',
    COLORS: [0x4a90d9, 0x4caf50, 0x9c27b0, 0xf44336, 0xffeb3b],
  };

  let app, state = 'menu';
  let score = 0, level = 1, shotsFired = 0, lastShiftShot = 0;
  let bubbleRadius, hexW, hexH, gx, gy, wL, wR;
  let grid = [];
  let cannon, cannonAngle;
  let proj = null;
  let parts = [], fallAnims = [];
  let canFire = true, nextColor, pointerX = W / 2, pointerY = H / 2;
  let scoreTxt, levelTxt, meterFillImg, meterMask, meterPctLabel;
  let gameOverOverlay = null, particleTex;

  let bgContainer, gameContainer, menuContainer;
  let gridContainer, projContainer, partContainer, trajContainer, hudContainer;

  const clearContainer = (c) => {
    while (c.children.length > 0) {
      const child = c.children[0];
      c.removeChild(child);
      child.destroy();
    }
  };

  const rnd = () => Math.random();

  const rndBubble = () => {
    const r = rnd();
    if (r < CFG.AIR_CHANCE) return CFG.COLOR_AIR;
    if (r < CFG.AIR_CHANCE + CFG.SPECIAL_CHANCE) return CFG.COLOR_SPECIAL;
    return Math.floor(rnd() * CFG.NUM_COLORS);
  };

  const neighbors = (r, c) => {
    const dirs = r % 2 === 0
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    const out = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < CFG.ROWS && nc >= 0 && nc < CFG.COLS) out.push({ r: nr, c: nc });
    }
    return out;
  };

  const sPos = (r, c) => ({
    x: gx + c * hexW + (r % 2 === 1 ? hexW / 2 : 0),
    y: gy + r * hexH,
  });

  const p2g = (px, py) => {
    const r = Math.round((py - gy) / hexH);
    const off = r % 2 === 1 ? hexW / 2 : 0;
    const c = Math.round((px - gx - off) / hexW);
    return {
      r: Math.max(0, Math.min(CFG.ROWS - 1, r)),
      c: Math.max(0, Math.min(CFG.COLS - 1, c)),
    };
  };

  const closestEmpty = (px, py) => {
    const a = p2g(px, py);
    const cands = [a, ...neighbors(a.r, a.c)];
    let best = null, bd = Infinity;
    for (const o of cands) {
      if (grid[o.r][o.c] !== null) continue;
      const p = sPos(o.r, o.c);
      const d = Math.hypot(px - p.x, py - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  };

  const matchColors = (a, b) => {
    if (a == null || b == null) return false;
    if (a === CFG.COLOR_AIR || b === CFG.COLOR_AIR) return false;
    if (a === CFG.COLOR_SPECIAL || b === CFG.COLOR_SPECIAL) return true;
    return a === b;
  };

  const frameForColor = (c) => {
    if (c >= 0 && c < CFG.NUM_COLORS) return CFG.BUBBLE_FRAMES[c];
    if (c === CFG.COLOR_SPECIAL) return CFG.FRAME_SPECIAL;
    if (c === CFG.COLOR_AIR) return CFG.FRAME_AIR;
    return null;
  };

  const flood = (r, c) => {
    const colr = grid[r][c];
    if (colr == null || colr === CFG.COLOR_AIR) return [];
    const vis = new Set();
    const out = [];
    const q = [{ r, c }];
    while (q.length) {
      const cur = q.shift();
      const k = cur.r + ',' + cur.c;
      if (vis.has(k)) continue;
      vis.add(k);
      out.push(cur);
      for (const n of neighbors(cur.r, cur.c)) {
        if (vis.has(n.r + ',' + n.c)) continue;
        if (grid[n.r][n.c] == null) continue;
        if (matchColors(grid[n.r][n.c], colr)) q.push(n);
      }
    }
    return out;
  };

  const findFloating = () => {
    const vis = new Set();
    const q = [];
    for (let c = 0; c < CFG.COLS; c++) {
      if (grid[0][c] != null) { vis.add('0,' + c); q.push({ r: 0, c }); }
    }
    while (q.length) {
      const cur = q.shift();
      for (const n of neighbors(cur.r, cur.c)) {
        const nk = n.r + ',' + n.c;
        if (vis.has(nk)) continue;
        if (grid[n.r][n.c] == null) continue;
        vis.add(nk);
        q.push(n);
      }
    }
    const float = [];
    for (let r = 0; r < CFG.ROWS; r++)
      for (let c = 0; c < CFG.COLS; c++)
        if (grid[r][c] != null && !vis.has(r + ',' + c)) float.push({ r, c });
    return float;
  };

  const calcGrid = () => {
    const margin = 15;
    const usableW = W - margin * 2;
    bubbleRadius = usableW / (Math.sqrt(3) * (CFG.COLS - 0.5) + 1.5);
    hexW = Math.sqrt(3) * bubbleRadius;
    hexH = bubbleRadius * 1.5;
    const gridW = hexW * (CFG.COLS - 1) + 2 * bubbleRadius;
    gx = (W - gridW) / 2;
    gy = 70;
    wL = gx;
    wR = gx + hexW * (CFG.COLS - 1) + 2 * bubbleRadius;
  };

  const buildGrid = () => {
    grid = [];
    for (let r = 0; r < CFG.ROWS; r++) {
      const row = [];
      for (let c = 0; c < CFG.COLS; c++)
        row.push(r < CFG.INITIAL_ROWS ? rndBubble() : null);
      grid.push(row);
    }
  };

  const renderGrid = () => {
    if (gridContainer && gridContainer.children) {
      while (gridContainer.children.length > 0) {
        const child = gridContainer.children[0];
        gridContainer.removeChild(child);
        child.destroy();
      }
    }
    const ts = bubbleRadius * 2;
    for (let r = 0; r < CFG.ROWS; r++) {
      for (let c = 0; c < CFG.COLS; c++) {
        const v = grid[r][c];
        if (v == null) continue;
        const frame = frameForColor(v);
        if (!frame) continue;
        const p = sPos(r, c);
        const spr = PIXI.Sprite.from(frame);
        spr.anchor.set(0.5);
        spr.x = p.x;
        spr.y = p.y;
        spr.width = ts;
        spr.height = ts;
        gridContainer.addChild(spr);
      }
    }
  };

  const shiftDown = () => {
    if (state !== 'playing') return;
    for (let c = 0; c < CFG.COLS; c++) {
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
    }
    for (let r = CFG.ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
    grid[0] = Array.from({ length: CFG.COLS }, () => rndBubble());
    renderGrid();
    for (let c = 0; c < CFG.COLS; c++) {
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
    }
  };

  const setUpCannon = () => {
    if (cannon) cannon.destroy();
    cannon = PIXI.Sprite.from(CFG.FRAME_CANNON);
    cannon.anchor.set(0.5);
    cannon.x = W / 2;
    cannon.y = H - 70;
    const sz = bubbleRadius * 2.4;
    cannon.width = sz;
    cannon.height = sz;
    cannon.rotation = -Math.PI / 2;
    const base = new PIXI.Graphics();
    base.beginFill(0x222244, 0.8);
    base.drawCircle(0, 0, 22);
    base.endFill();
    base.x = cannon.x;
    base.y = cannon.y;
    hudContainer.addChild(base);
    hudContainer.addChild(cannon);
  };

  const updateCannon = () => {
    if (!cannon || state !== 'playing') return;
    const dx = pointerX - cannon.x;
    const dy = pointerY - cannon.y;
    let a = Math.atan2(dy, dx);
    if (a > -0.1) a = -0.1;
    if (a < -Math.PI + 0.1) a = -Math.PI + 0.1;
    cannonAngle = a;
    cannon.rotation = a;
  };

  const drawTraj = () => {
    clearContainer(trajContainer);
    if (state !== 'playing' || !cannon) return;
    let ax = cannon.x, ay = cannon.y;
    let adx = Math.cos(cannonAngle), ady = Math.sin(cannonAngle);
    const step = 8, maxS = 180;
    const pts = [];
    for (let i = 0; i < maxS; i++) {
      ax += adx * step; ay += ady * step;
      if (ax < wL) { ax = wL + (wL - ax); adx = -adx; }
      else if (ax > wR) { ax = wR - (ax - wR); adx = -adx; }
      if (ay < gy - bubbleRadius) break;
      const approx = p2g(ax, ay);
      let hit = false;
      for (const n of neighbors(approx.r, approx.c)) {
        if (grid[n.r][n.c] == null) continue;
        const p = sPos(n.r, n.c);
        if (Math.hypot(ax - p.x, ay - p.y) < hexW * 0.75) { hit = true; break; }
      }
      if (hit) break;
      pts.push({ x: ax, y: ay });
    }
    for (let i = 0; i < pts.length; i++) {
      const a = 0.2 + 0.5 * (1 - i / pts.length);
      const r = 1.5 + (1 - i / pts.length) * 1.5;
      const dot = new PIXI.Graphics();
      dot.beginFill(0xffffff, a);
      dot.drawCircle(pts[i].x, pts[i].y, r);
      dot.endFill();
      trajContainer.addChild(dot);
    }
  };

  const fire = () => {
    if (state !== 'playing' || !cannon || !canFire || proj) return;
    canFire = false;
    const a = cannonAngle;
    const sx = cannon.x + Math.cos(a) * 28;
    const sy = cannon.y + Math.sin(a) * 28;
    proj = {
      x: sx, y: sy,
      vx: Math.cos(a) * CFG.SHOOT_SPEED,
      vy: Math.sin(a) * CFG.SHOOT_SPEED,
      color: nextColor, active: true,
    };
    const frame = frameForColor(proj.color);
    if (frame) {
      const ts = bubbleRadius * 2;
      proj.spr = PIXI.Sprite.from(frame);
      proj.spr.anchor.set(0.5);
      proj.spr.x = proj.x; proj.spr.y = proj.y;
      proj.spr.width = ts; proj.spr.height = ts;
      projContainer.addChild(proj.spr);
    }
    shotsFired++;
    nextColor = rndBubble();
    showNextBubble();
    updateHUD();
  };

  const snap = () => {
    if (!proj) { canFire = true; return; }
    const slot = closestEmpty(proj.x, proj.y);
    if (!slot) {
      if (proj.spr) { projContainer.removeChild(proj.spr); proj.spr.destroy(); }
      proj = null; canFire = true; return;
    }
    const pos = sPos(slot.r, slot.c);
    if (proj.spr) {
      proj.spr.x = pos.x; proj.spr.y = pos.y;
      projContainer.removeChild(proj.spr);
      proj.spr.destroy();
    }
    grid[slot.r][slot.c] = proj.color;
    const frame = frameForColor(proj.color);
    if (frame) {
      const ts = bubbleRadius * 2;
      const ns = PIXI.Sprite.from(frame);
      ns.anchor.set(0.5); ns.x = pos.x; ns.y = pos.y;
      ns.width = ts; ns.height = ts;
      gridContainer.addChild(ns);
    }
    proj = null;
    canFire = true;
    processMatch(slot.r, slot.c);
    if (shotsFired > 0 && shotsFired % CFG.SHOTS_PER_ROW === 0 && shotsFired !== lastShiftShot) {
      shiftDown();
      lastShiftShot = shotsFired;
    }
  };

  const processMatch = (r, c) => {
    const matched = flood(r, c);
    if (matched.length >= 3) {
      popBubbles(matched);
      renderGrid();
      checkGameOver();
    }
    updateHUD();
  };

  const popBubbles = (matched) => {
    for (const o of matched) {
      const p = sPos(o.r, o.c);
      spawnParticles(p.x, p.y, grid[o.r][o.c]);
      grid[o.r][o.c] = null;
    }
    score += matched.length * CFG.POP_SCORE;
    const floating = findFloating();
    for (const f of floating) {
      const p = sPos(f.r, f.c);
      const cv = grid[f.r][f.c];
      spawnParticles(p.x, p.y, cv);
      spawnFalling(p.x, p.y, cv);
      grid[f.r][f.c] = null;
      score += CFG.FLOAT_SCORE;
    }
    let allClear = true;
    for (let r = 0; r < CFG.ROWS; r++)
      for (let c = 0; c < CFG.COLS; c++)
        if (grid[r][c] !== null) { allClear = false; break; }
    if (allClear) {
      level++;
      buildGrid();
      renderGrid();
    }
  };

  const spawnParticles = (x, y, colr) => {
    const cnt = Math.min(8, 300 - parts.length);
    if (cnt <= 0 || !particleTex) return;
    const col = CFG.COLORS[colr] || 0xffffff;
    for (let i = 0; i < cnt; i++) {
      const spr = new PIXI.Sprite(particleTex);
      spr.anchor.set(0.5);
      spr.x = x + (rnd() - 0.5) * 10;
      spr.y = y + (rnd() - 0.5) * 10;
      spr.tint = col;
      spr.alpha = 1;
      spr.rotation = rnd() * Math.PI * 2;
      const sc = 0.2 + rnd() * 0.4;
      spr.scale.set(sc);
      partContainer.addChild(spr);
      parts.push({
        spr,
        vx: (rnd() - 0.5) * 8,
        vy: -3 + rnd() * 5,
        rot: (rnd() - 0.5) * 0.3,
        life: 1,
        decay: 0.015 + rnd() * 0.02,
      });
    }
  };

  const spawnFalling = (x, y, colr) => {
    const frame = frameForColor(colr);
    if (!frame) return;
    const ts = bubbleRadius * 2;
    const spr = PIXI.Sprite.from(frame);
    spr.anchor.set(0.5);
    spr.x = x; spr.y = y;
    spr.width = ts; spr.height = ts;
    spr.alpha = 1;
    partContainer.addChild(spr);
    fallAnims.push({
      spr,
      vx: (rnd() - 0.5) * 3,
      vy: 2 + rnd() * 3,
      rot: (rnd() - 0.5) * 0.1,
      life: 1,
      decay: 0.008 + rnd() * 0.008,
      ts,
    });
  };

  const checkGameOver = () => {
    for (let c = 0; c < CFG.COLS; c++)
      if (grid[CFG.ROWS - 1][c] !== null) { showGameOver(); return; }
  };

  const updateProj = (dt) => {
    if (!proj || !proj.active) return;
    const p = proj;
    const steps = 3;
    for (let s = 0; s < steps; s++) {
      p.x += p.vx * (dt / steps);
      p.y += p.vy * (dt / steps);
      if (p.x < wL) { p.x = wL + (wL - p.x); p.vx = -p.vx; }
      else if (p.x > wR) { p.x = wR - (p.x - wR); p.vx = -p.vx; }
      if (p.y < gy - bubbleRadius) { snap(); return; }
      const approx = p2g(p.x, p.y);
      let hit = false;
      for (const n of neighbors(approx.r, approx.c)) {
        if (grid[n.r][n.c] == null) continue;
        const pos = sPos(n.r, n.c);
        if (Math.hypot(p.x - pos.x, p.y - pos.y) < hexW * 0.75) { hit = true; break; }
      }
      if (hit) { snap(); return; }
    }
    if (p.spr) { p.spr.x = p.x; p.spr.y = p.y; p.spr.rotation += 0.05 * dt; }
  };

  const updateParticles = (dt) => {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.spr.x += p.vx * dt;
      p.spr.y += p.vy * dt;
      p.spr.rotation += p.rot * dt;
      p.vy += 0.15 * dt;
      p.life -= p.decay * dt;
      p.spr.alpha = Math.max(0, p.life);
      const sc = p.life * 0.5;
      p.spr.scale.set(Math.max(0, sc));
      if (p.life <= 0) {
        partContainer.removeChild(p.spr);
        p.spr.destroy();
        parts.splice(i, 1);
      }
    }
  };

  const updateFallAnims = (dt) => {
    for (let i = fallAnims.length - 1; i >= 0; i--) {
      const a = fallAnims[i];
      a.spr.x += a.vx * dt;
      a.spr.y += a.vy * dt;
      a.spr.rotation += a.rot * dt;
      a.vy += 0.2 * dt;
      a.life -= a.decay * dt;
      a.spr.alpha = Math.max(0, a.life);
      const s = a.life * a.ts;
      a.spr.width = Math.max(0, s);
      a.spr.height = Math.max(0, s);
      if (a.life <= 0) {
        partContainer.removeChild(a.spr);
        a.spr.destroy();
        fallAnims.splice(i, 1);
      }
    }
  };

  const createHUD = () => {
    const hud = new PIXI.Container();

    const bgBar = new PIXI.Graphics();
    bgBar.beginFill(0x000000, 0.5);
    bgBar.drawRect(0, 0, W, 42);
    bgBar.endFill();
    hud.addChild(bgBar);

    scoreTxt = new PIXI.Text('Score: 0', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 18,
      fill: '#fff', fontWeight: 'bold',
      dropShadow: true, dropShadowColor: '#000',
      dropShadowBlur: 3, dropShadowDistance: 1,
    });
    scoreTxt.x = 10; scoreTxt.y = 10;
    hud.addChild(scoreTxt);

    levelTxt = new PIXI.Text('Level 1', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 16,
      fill: '#ffd700', fontWeight: 'bold',
      dropShadow: true, dropShadowColor: '#000',
      dropShadowBlur: 2, dropShadowDistance: 1,
    });
    levelTxt.anchor.set(0.5, 0);
    levelTxt.x = W / 2; levelTxt.y = 11;
    hud.addChild(levelTxt);

    const meterContainer = new PIXI.Container();
    meterContainer.x = 10; meterContainer.y = 46;

    const meterBg = PIXI.Sprite.from(CFG.FRAME_SCORE_BAR);
    meterBg.width = 150; meterBg.height = 24;
    meterContainer.addChild(meterBg);

    const fillContainer = new PIXI.Container();
    fillContainer.x = 4; fillContainer.y = 4;

    meterFillImg = PIXI.Sprite.from(CFG.PREMIUM_METER);
    meterFillImg.width = 142;
    meterFillImg.height = 16;
    fillContainer.addChild(meterFillImg);

    meterMask = new PIXI.Graphics();
    meterMask.beginFill(0xffffff);
    meterMask.drawRect(0, 0, 0, 16);
    meterMask.endFill();
    fillContainer.addChild(meterMask);

    meterFillImg.mask = meterMask;
    meterContainer.addChild(fillContainer);

    meterPctLabel = new PIXI.Text('0%', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 11,
      fill: '#fff', fontWeight: 'bold',
    });
    meterPctLabel.x = 160; meterPctLabel.y = 5;
    meterContainer.addChild(meterPctLabel);

    hud.addChild(meterContainer);
    hudContainer.addChild(hud);
  };

  const updateHUD = () => {
    if (scoreTxt) scoreTxt.text = 'Score: ' + score;
    if (levelTxt) levelTxt.text = 'Level ' + level;
    if (meterMask && meterFillImg) {
      const maxScore = level * 500;
      const pct = Math.min(1, score / maxScore);
      meterMask.clear();
      meterMask.beginFill(0xffffff);
      meterMask.drawRect(0, 0, 142 * pct, 16);
      meterMask.endFill();
      if (meterPctLabel) meterPctLabel.text = Math.floor(pct * 100) + '%';
    }
  };

  const showNextBubble = () => {
    const old = hudContainer.getChildByName('nextPreview', true);
    if (old) { hudContainer.removeChild(old); old.destroy(); }
    const frame = frameForColor(nextColor);
    if (!frame) return;
    const sz = bubbleRadius * 0.6;
    const s = PIXI.Sprite.from(frame);
    s.name = 'nextPreview';
    s.anchor.set(0.5);
    s.width = sz; s.height = sz;
    s.x = W - 30; s.y = 18;
    hudContainer.addChild(s);
  };

  const showGameOver = () => {
    if (state === 'gameover') return;
    state = 'gameover';
    proj = null;
    canFire = true;

    const overlay = new PIXI.Container();

    const ov = new PIXI.Graphics();
    ov.beginFill(0x000000, 0.75);
    ov.drawRect(0, 0, W, H);
    ov.endFill();
    overlay.addChild(ov);

    const gt = new PIXI.Text('GAME OVER', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 48,
      fill: '#ff4444', fontWeight: '900',
      dropShadow: true, dropShadowColor: '#000',
      dropShadowBlur: 8, dropShadowDistance: 3,
    });
    gt.anchor.set(0.5); gt.x = W / 2; gt.y = H * 0.30;
    overlay.addChild(gt);

    const fs = new PIXI.Text('Score: ' + score, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 28,
      fill: '#ffd700', fontWeight: 'bold',
    });
    fs.anchor.set(0.5); fs.x = W / 2; fs.y = H * 0.40;
    overlay.addChild(fs);

    const fl = new PIXI.Text('Level ' + level, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 22,
      fill: '#fff', fontWeight: 'bold',
    });
    fl.anchor.set(0.5); fl.x = W / 2; fl.y = H * 0.46;
    overlay.addChild(fl);

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x4a90d9);
    btnBg.drawRoundedRect(-85, -22, 170, 44, 10);
    btnBg.endFill();
    btnBg.x = W / 2; btnBg.y = H * 0.56;
    btnBg.eventMode = 'static';
    btnBg.cursor = 'pointer';
    overlay.addChild(btnBg);

    const rt = new PIXI.Text('RESTART', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 20,
      fill: '#fff', fontWeight: 'bold',
    });
    rt.anchor.set(0.5); rt.x = W / 2; rt.y = H * 0.56;
    overlay.addChild(rt);

    const hitArea = new PIXI.Graphics();
    hitArea.beginFill(0xffffff, 0.001);
    hitArea.drawRect(-90, -24, 180, 48);
    hitArea.endFill();
    hitArea.x = W / 2; hitArea.y = H * 0.56;
    hitArea.eventMode = 'static';
    hitArea.cursor = 'pointer';
    hitArea.on('pointerdown', () => {
      gameContainer.removeChild(overlay);
      overlay.destroy({ children: true });
      initPlaying();
    });
    overlay.addChild(hitArea);

    gameOverOverlay = overlay;
    gameContainer.addChild(overlay);
  };

  const initPlaying = () => {
    state = 'playing';
    score = 0; level = 1; shotsFired = 0; lastShiftShot = 0;
    proj = null; parts = []; fallAnims = [];
    clearContainer(gridContainer);
    clearContainer(projContainer);
    clearContainer(partContainer);
    clearContainer(trajContainer);
    clearContainer(hudContainer);

    calcGrid();
    buildGrid();
    renderGrid();
    setUpCannon();
    createHUD();
    canFire = true;
    nextColor = rndBubble();
    showNextBubble();
    updateHUD();
  };

  const createMenu = () => {
    const title = new PIXI.Text('BUBBLE\nSHOOTER', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 48,
      fill: '#fff', fontWeight: '900', align: 'center',
      dropShadow: true, dropShadowColor: '#000',
      dropShadowBlur: 8, dropShadowDistance: 3, letterSpacing: 3,
    });
    title.anchor.set(0.5);
    title.x = W / 2; title.y = H * 0.28;
    menuContainer.addChild(title);

    const playBtn = PIXI.Sprite.from(CFG.FRAME_PLAY_BTN);
    playBtn.anchor.set(0.5);
    playBtn.x = W / 2;
    playBtn.y = H * 0.55;
    const btnSize = Math.min(W * 0.4, 140);
    playBtn.width = btnSize;
    playBtn.height = btnSize;
    playBtn.eventMode = 'static';
    playBtn.cursor = 'pointer';
    playBtn.hitArea = new PIXI.Rectangle(
      -btnSize / 2, -btnSize / 2, btnSize, btnSize
    );
    playBtn.on('pointerdown', () => startGame());
    menuContainer.addChild(playBtn);

    const hint = new PIXI.Text('Click or Press "N" to Play', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: 16,
      fill: '#fff', fontWeight: '300',
      dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 3,
    });
    hint.anchor.set(0.5);
    hint.x = W / 2; hint.y = H * 0.66;
    menuContainer.addChild(hint);
  };

  const startGame = () => {
    if (state !== 'menu') return;
    menuContainer.visible = false;
    gameContainer.visible = true;
    initPlaying();
  };

  const resize = () => {
    const parent = document.getElementById('game-container');
    if (!parent || !app) return;
    const mw = parent.clientWidth, mh = parent.clientHeight;
    const s = Math.min(mw / W, mh / H);
    const w = Math.floor(W * s), h = Math.floor(H * s);
    app.view.style.cssText =
      'position:absolute;width:' + w + 'px;height:' + h + 'px;' +
      'left:' + Math.floor((mw - w) / 2) + 'px;top:' + Math.floor((mh - h) / 2) + 'px';
  };

  const generateTextures = () => {
    const pG = new PIXI.Graphics();
    pG.beginFill(0xffffff);
    pG.drawCircle(0, 0, 8);
    pG.endFill();
    particleTex = app.renderer.generateTexture(pG);
    pG.destroy();

    const airG = new PIXI.Graphics();
    airG.beginFill(0xffffff, 0.25);
    airG.lineStyle(2, 0x88ccff, 0.5);
    airG.drawCircle(32, 32, 28);
    airG.endFill();
    airG.lineStyle(1, 0xaaeeff, 0.3);
    airG.drawCircle(32, 32, 20);
    const airTex = app.renderer.generateTexture(airG);
    PIXI.Texture.addToCache(airTex, CFG.FRAME_AIR);
    airG.destroy();

    const canG = new PIXI.Graphics();
    canG.beginFill(0x6666aa);
    canG.drawRoundedRect(0, -10, 42, 20, 4);
    canG.endFill();
    canG.beginFill(0x555588);
    canG.drawCircle(0, 0, 14);
    canG.endFill();
    canG.beginFill(0x7777bb);
    canG.drawCircle(0, 0, 8);
    canG.endFill();
    const canTex = app.renderer.generateTexture(canG);
    PIXI.Texture.addToCache(canTex, CFG.FRAME_CANNON);
    canG.destroy();

    const scoreG = new PIXI.Graphics();
    scoreG.beginFill(0x222244, 0.9);
    scoreG.drawRoundedRect(0, 0, 150, 24, 4);
    scoreG.endFill();
    scoreG.lineStyle(2, 0x4444aa);
    scoreG.drawRoundedRect(0, 0, 150, 24, 4);
    const scoreTex = app.renderer.generateTexture(scoreG);
    PIXI.Texture.addToCache(scoreTex, CFG.FRAME_SCORE_BAR);
    scoreG.destroy();
  };

  const loop = (dt) => {
    if (state === 'playing') {
      updateCannon();
      drawTraj();
      updateProj(dt);
      updateParticles(dt);
      updateFallAnims(dt);
    } else {
      updateParticles(dt);
      updateFallAnims(dt);
    }
  };

  const init = async () => {
    app = new PIXI.Application({
      width: W, height: H,
      backgroundColor: 0x0a0a1a,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    document.getElementById('game-container').appendChild(app.view);
    window.addEventListener('resize', resize);
    resize();

    const loadText = new PIXI.Text('Loading...', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 32, fill: '#fff', fontWeight: 'bold',
    });
    loadText.anchor.set(0.5);
    loadText.x = W / 2;
    loadText.y = H / 2;
    app.stage.addChild(loadText);

    const loadPromises = [];
    for (const [frame, src] of Object.entries(CFG.FRAME_ALIASES)) {
      loadPromises.push(
        PIXI.Assets.load(src).then((tex) => {
          PIXI.Texture.addToCache(tex, frame);
        })
      );
    }
    loadPromises.push(PIXI.Assets.load(CFG.BG_PATH).catch(() => {}));
    loadPromises.push(PIXI.Assets.load(CFG.PREMIUM_METER).catch(() => {}));

    await Promise.allSettled(loadPromises);

    if (loadText.parent) {
      loadText.destroy();
    }

    generateTextures();

    bgContainer = new PIXI.Container();
    gameContainer = new PIXI.Container();
    gameContainer.visible = false;
    menuContainer = new PIXI.Container();

    app.stage.addChild(bgContainer);
    app.stage.addChild(gameContainer);
    app.stage.addChild(menuContainer);

    try {
      const bg = PIXI.Sprite.from(CFG.BG_PATH);
      bg.width = W;
      bg.height = H;
      bgContainer.addChild(bg);
    } catch (e) {
      const fallbackBg = new PIXI.Graphics();
      fallbackBg.beginFill(0x0a0a1a);
      fallbackBg.drawRect(0, 0, W, H);
      fallbackBg.endFill();
      bgContainer.addChild(fallbackBg);
    }

    gridContainer = new PIXI.Container();
    projContainer = new PIXI.Container();
    partContainer = new PIXI.Container();
    trajContainer = new PIXI.Container();
    hudContainer = new PIXI.Container();

    gameContainer.addChild(gridContainer);
    gameContainer.addChild(partContainer);
    gameContainer.addChild(projContainer);
    gameContainer.addChild(trajContainer);
    gameContainer.addChild(hudContainer);

    const ptrLayer = new PIXI.Graphics();
    ptrLayer.beginFill(0x000000, 0.001);
    ptrLayer.drawRect(0, 0, W, H);
    ptrLayer.endFill();
    ptrLayer.eventMode = 'static';
    ptrLayer.on('pointermove', (e) => {
      pointerX = e.global.x;
      pointerY = e.global.y;
    });
    ptrLayer.on('pointerdown', () => {
      if (state === 'playing') fire();
    });
    gameContainer.addChild(ptrLayer);

    createMenu();

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'n' && state === 'menu') {
        startGame();
      }
    });

    app.ticker.add((d) => loop(d));
  };

  init().catch(console.error);
})();
