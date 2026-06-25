(() => {
  const CONFIG = {
    COLS: 8, ROWS: 14, INITIAL_ROWS: 5, SHOOT_SPEED: 18,
    POP_SCORE: 10, FLOAT_SCORE: 25, SHOTS_PER_ROW: 7, NUM_COLORS: 5,
    IMAGE_PATH: 'asets/new image/',
    SCORE_BAR_IMAGE: '/home/user/traff-game-/asets/new image/Gemini_Generated_Image_k3tv0xk3tv0xk3tv.png',
    BUBBLE_COLORS: [
      { name: 'blue',   file: 'blue boll.png' },
      { name: 'green',  file: 'green boll.png' },
      { name: 'purple', file: 'pulpul boll.png' },
      { name: 'red',    file: 'red boll.png' },
      { name: 'yellow', file: 'yelloboll.png' },
    ],
    BUBBLE_SPECIAL: { name: 'colorful', file: 'colorfull boll.png' },
    BUBBLE_AIR:     { name: 'air',      file: 'Gemini_Generated_Image_a76ulba76ulba76u.png' },
    COLOR_AIR: 5,
    COLOR_SPECIAL: 6,
    SPECIAL_CHANCE: 0.12,
    AIR_CHANCE: 0.08,
    MAX_PARTICLES: 300,
    UI: {
      premiumPlay: 'Gemini_Generated_Image_k3tv0xk3tv0xk3tv.png',
      back: 'back.png', pause: 'puss .png', play: 'play.png',
    },
  };

  const W = 540;
  const H = 960;
  const IMG = CONFIG.IMAGE_PATH;
  const COLOR_VALS = [0x4a90d9, 0x4caf50, 0x9c27b0, 0xf44336, 0xffeb3b, 0xff9800, 0x90a4ae];

  let app;
  let bgSprite, gameContainer, menuContainer;
  let gridContainer, projContainer, partContainer, trajContainer, hudContainer;
  let grid = [];
  let state = 'menu';
  let score = 0, level = 1, shotsFired = 0, lastShiftShot = 0;
  let bubbleRadius, hexW, hexH, gx, gy, gTop, gBot, wL, wR;
  let cannon, cannonAngle, cannonFlash;
  let proj = null;
  let parts = [], popAnims = [];
  let canFire = true;
  let nextColor;
  let scoreTxt, levelTxt, shotsTxt, nextTxt;
  let meterFill, meterPctLabel;
  let bubbleTextures = {};
  let particleTex;
  let pointerX = W / 2, pointerY = H / 2;

  function rnd() { return Math.random(); }

  function rndBubble() {
    const r = rnd();
    if (r < CONFIG.AIR_CHANCE) return CONFIG.COLOR_AIR;
    if (r < CONFIG.AIR_CHANCE + CONFIG.SPECIAL_CHANCE) return CONFIG.COLOR_SPECIAL;
    return Math.floor(rnd() * CONFIG.NUM_COLORS);
  }

  function rndNext() {
    const r = rnd();
    if (r < CONFIG.AIR_CHANCE) return CONFIG.COLOR_AIR;
    if (r < CONFIG.AIR_CHANCE + CONFIG.SPECIAL_CHANCE) return CONFIG.COLOR_SPECIAL;
    return Math.floor(rnd() * CONFIG.NUM_COLORS);
  }

  function neighbors(row, col) {
    const dirs = row % 2 === 0
      ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
      : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
    const o = [];
    for (const [dr, dc] of dirs) {
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < CONFIG.ROWS && c >= 0 && c < CONFIG.COLS) o.push({ r, c });
    }
    return o;
  }

  function sPos(row, col) {
    return { x: gx + col * hexW + (row % 2 === 1 ? hexW / 2 : 0), y: gy + row * hexH };
  }

  function p2g(px_, py_) {
    const row = Math.round((py_ - gy) / hexH);
    const off = row % 2 === 1 ? hexW / 2 : 0;
    const col = Math.round((px_ - gx - off) / hexW);
    return { r: Math.max(0, Math.min(CONFIG.ROWS - 1, row)), c: Math.max(0, Math.min(CONFIG.COLS - 1, col)) };
  }

  function closestEmpty(px_, py_) {
    const a = p2g(px_, py_);
    const cands = [a, ...neighbors(a.r, a.c)];
    let best = null, bd = Infinity;
    for (const o of cands) {
      if (o.r < 0 || o.r >= CONFIG.ROWS || o.c < 0 || o.c >= CONFIG.COLS) continue;
      if (grid[o.r][o.c] !== null) continue;
      const p = sPos(o.r, o.c);
      const d = Math.hypot(px_ - p.x, py_ - p.y);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function cMatch(a, b) {
    if (a == null || b == null) return false;
    if (a === CONFIG.COLOR_AIR || b === CONFIG.COLOR_AIR) return false;
    if (a === CONFIG.COLOR_SPECIAL || b === CONFIG.COLOR_SPECIAL) return true;
    return a === b;
  }

  function flood(row, col) {
    const colr = grid[row][col];
    if (colr == null || colr === CONFIG.COLOR_AIR) return [];
    const vis = new Set();
    const cl = [];
    const q = [{ r: row, c: col }];
    while (q.length) {
      const cur = q.shift();
      const k = cur.r + ',' + cur.c;
      if (vis.has(k)) continue;
      vis.add(k);
      cl.push(cur);
      for (const n of neighbors(cur.r, cur.c)) {
        const nk = n.r + ',' + n.c;
        if (vis.has(nk)) continue;
        if (grid[n.r][n.c] == null) continue;
        if (cMatch(grid[n.r][n.c], colr)) q.push(n);
      }
    }
    return cl;
  }

  function findFloat() {
    const vis = new Set();
    const q = [];
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[0][c] != null) { q.push({ r: 0, c }); vis.add('0,' + c); }
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
    for (let r = 0; r < CONFIG.ROWS; r++)
      for (let c = 0; c < CONFIG.COLS; c++)
        if (grid[r][c] != null && !vis.has(r + ',' + c)) float.push({ r, c });
    return float;
  }

  function texForColor(colr) {
    if (colr >= 0 && colr < CONFIG.NUM_COLORS) return bubbleTextures[CONFIG.BUBBLE_COLORS[colr].name];
    if (colr === CONFIG.COLOR_SPECIAL) return bubbleTextures.special;
    if (colr === CONFIG.COLOR_AIR) return bubbleTextures.air;
    return null;
  }

  function resize() {
    const parent = document.getElementById('game-container');
    if (!parent || !app) return;
    const mw = parent.clientWidth, mh = parent.clientHeight;
    const s = Math.min(mw / W, mh / H);
    const w = Math.floor(W * s), h = Math.floor(H * s);
    app.view.style.cssText = `position:absolute;width:${w}px;height:${h}px;left:${Math.floor((mw-w)/2)}px;top:${Math.floor((mh-h)/2)}px`;
  }

  function calcGrid() {
    const margin = 20;
    const usableW = W - margin * 2;
    bubbleRadius = usableW / (Math.sqrt(3) * (CONFIG.COLS - 0.5) + 2);
    hexW = Math.sqrt(3) * bubbleRadius;
    hexH = bubbleRadius * 1.5;
    const gridW = hexW * (CONFIG.COLS - 1) + 2 * bubbleRadius;
    gx = (W - gridW) / 2;
    gy = 50;
    gTop = gy - bubbleRadius;
    gBot = gy + (CONFIG.ROWS - 1) * hexH + bubbleRadius;
    wL = gx;
    wR = gx + hexW * (CONFIG.COLS - 1) + 2 * bubbleRadius;
  }

  function buildGrid() {
    grid = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
      const row = [];
      for (let c = 0; c < CONFIG.COLS; c++) row.push(r < CONFIG.INITIAL_ROWS ? rndBubble() : null);
      grid.push(row);
    }
  }

  function renderGrid() {
    gridContainer.removeChildren(true);
    const ts = bubbleRadius * 2;
    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const v = grid[r][c];
        if (v == null) continue;
        const tex = texForColor(v);
        if (!tex) continue;
        const p = sPos(r, c);
        const spr = new PIXI.Sprite(tex);
        spr.anchor.set(0.5); spr.x = p.x; spr.y = p.y;
        spr.width = ts; spr.height = ts;
        gridContainer.addChild(spr);
      }
    }
  }

  function shiftDown() {
    if (state !== 'playing') return;
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[CONFIG.ROWS - 1][c] !== null) { showGameOver(); return; }
    }
    for (let r = CONFIG.ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
    grid[0] = [];
    for (let c = 0; c < CONFIG.COLS; c++) grid[0].push(rndBubble());
    renderGrid();
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[CONFIG.ROWS - 1][c] !== null) { showGameOver(); return; }
    }
  }

  function setUpCannon(tex) {
    if (cannon) { cannon.destroy(); cannon = null; }
    cannon = new PIXI.Sprite(tex);
    cannon.anchor.set(0.5, 0.5);
    cannon.x = W / 2;
    cannon.y = H - 70;
    cannon.width = bubbleRadius * 2.4;
    cannon.height = bubbleRadius * 2.4;
    cannon.rotation = -Math.PI / 2;

    cannonFlash = new PIXI.Graphics();
    cannonFlash.beginFill(0xffff88, 0.6);
    cannonFlash.drawCircle(0, 0, 18);
    cannonFlash.endFill();
    cannonFlash.x = cannon.x;
    cannonFlash.y = cannon.y;
    cannonFlash.visible = false;

    const base = new PIXI.Graphics();
    base.beginFill(0x222244, 0.8);
    base.drawCircle(0, 0, 22);
    base.endFill();
    base.x = cannon.x;
    base.y = cannon.y;

    hudContainer.addChild(base);
    hudContainer.addChild(cannonFlash);
    hudContainer.addChild(cannon);
  }

  function createHUD(textures) {
    const hud = new PIXI.Container();

    const bgBar = new PIXI.Graphics();
    bgBar.beginFill(0x000000, 0.5);
    bgBar.drawRoundedRect(0, 0, W, 42, 0);
    bgBar.endFill();
    hud.addChild(bgBar);

    scoreTxt = new PIXI.Text('Score: 0', { fontFamily: 'Segoe UI, sans-serif', fontSize: 18, fill: '#fff', fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 3, dropShadowDistance: 1 });
    scoreTxt.x = 10; scoreTxt.y = 10;
    hud.addChild(scoreTxt);

    levelTxt = new PIXI.Text('Level 1', { fontFamily: 'Segoe UI, sans-serif', fontSize: 16, fill: '#ffd700', fontWeight: 'bold', dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 2, dropShadowDistance: 1 });
    levelTxt.anchor.set(0.5, 0);
    levelTxt.x = W / 2; levelTxt.y = 11;
    hud.addChild(levelTxt);

    shotsTxt = new PIXI.Text('', { fontFamily: 'Segoe UI, sans-serif', fontSize: 14, fill: '#aaddff', fontWeight: 'bold' });
    shotsTxt.x = W - 85; shotsTxt.y = 12;
    hud.addChild(shotsTxt);

    nextTxt = new PIXI.Text('Next:', { fontFamily: 'Segoe UI, sans-serif', fontSize: 12, fill: '#aaa', fontWeight: 'bold' });
    nextTxt.x = W - 85; nextTxt.y = 28;
    hud.addChild(nextTxt);

    const meterContainer = new PIXI.Container();
    meterContainer.x = 10;
    meterContainer.y = 46;

    const meterBg = textures.scoreBar
      ? new PIXI.Sprite(textures.scoreBar)
      : new PIXI.Graphics();
    if (textures.scoreBar) {
      meterBg.width = 120;
      meterBg.height = 18;
    } else {
      meterBg.beginFill(0x333333);
      meterBg.drawRoundedRect(0, 0, 120, 18, 3);
      meterBg.endFill();
    }
    meterContainer.addChild(meterBg);

    meterFill = new PIXI.Graphics();
    meterFill.x = 2;
    meterFill.y = 2;
    meterContainer.addChild(meterFill);

    meterPctLabel = new PIXI.Text('0%', { fontFamily: 'Segoe UI, sans-serif', fontSize: 10, fill: '#fff', fontWeight: 'bold' });
    meterPctLabel.x = 110;
    meterPctLabel.y = 4;
    meterContainer.addChild(meterPctLabel);

    hud.addChild(meterContainer);
    hudContainer.addChild(hud);
  }

  function updateHUD() {
    if (scoreTxt) scoreTxt.text = 'Score: ' + score;
    if (levelTxt) levelTxt.text = 'Level ' + level;
    if (shotsTxt) shotsTxt.text = 'Shots: ' + (shotsFired % CONFIG.SHOTS_PER_ROW) + '/' + CONFIG.SHOTS_PER_ROW;
    if (meterFill) {
      const meterMax = level * 500;
      const pct = Math.min(1, score / meterMax);
      meterFill.clear();
      meterFill.beginFill(0x00ff88, 0.85);
      meterFill.drawRect(0, 0, 116 * pct, 14);
      meterFill.endFill();
      if (meterPctLabel) meterPctLabel.text = Math.floor(pct * 100) + '%';
    }
  }

  function showNextBubble() {
    if (!nextTxt) return;
    const tex = texForColor(nextColor);
    if (!tex) return;
    const sz = bubbleRadius * 0.6;
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5);
    s.width = sz; s.height = sz;
    s.x = W - 22;
    s.y = 33;
    nextTxt.text = 'Next:';
    if (nextTxt._preview) { nextTxt._preview.destroy(); }
    nextTxt._preview = s;
    hudContainer.addChild(s);
  }

  function updateCannon() {
    if (!cannon || state !== 'playing') return;
    const dx = pointerX - cannon.x;
    const dy = pointerY - cannon.y;
    let a = Math.atan2(dy, dx);
    if (a > -0.1) a = -0.1;
    if (a < -Math.PI + 0.1) a = -Math.PI + 0.1;
    cannonAngle = a;
    cannon.rotation = a;
  }

  function drawTraj() {
    trajContainer.removeChildren(true);
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
  }

  function fire() {
    if (state !== 'playing' || !cannon || !canFire || proj) return;
    canFire = false;
    const a = cannonAngle;
    const cxn = cannon.x + Math.cos(a) * 28;
    const cyn = cannon.y + Math.sin(a) * 28;
    proj = {
      x: cxn, y: cyn,
      vx: Math.cos(a) * CONFIG.SHOOT_SPEED, vy: Math.sin(a) * CONFIG.SHOOT_SPEED,
      color: nextColor, active: true,
    };
    const tex = texForColor(proj.color);
    if (tex) {
      const ts = bubbleRadius * 2;
      proj.spr = new PIXI.Sprite(tex);
      proj.spr.anchor.set(0.5);
      proj.spr.x = proj.x; proj.spr.y = proj.y;
      proj.spr.width = ts; proj.spr.height = ts;
      projContainer.addChild(proj.spr);
    }

    if (cannonFlash) {
      cannonFlash.visible = true;
      cannonFlash.alpha = 1;
    }

    shotsFired++;
    nextColor = rndNext();
    showNextBubble();
    updateHUD();
  }

  function snap() {
    if (!proj) { canFire = true; return; }
    const slot = closestEmpty(proj.x, proj.y);
    if (!slot) {
      if (proj.spr) { projContainer.removeChild(proj.spr); proj.spr.destroy(); }
      proj = null;
      canFire = true;
      return;
    }
    const pos = sPos(slot.r, slot.c);
    if (proj.spr) {
      proj.spr.x = pos.x; proj.spr.y = pos.y;
      projContainer.removeChild(proj.spr);
      proj.spr.destroy();
    }
    grid[slot.r][slot.c] = proj.color;
    const tex = texForColor(proj.color);
    if (tex) {
      const ts = bubbleRadius * 2;
      const ns = new PIXI.Sprite(tex);
      ns.anchor.set(0.5); ns.x = pos.x; ns.y = pos.y;
      ns.width = ts; ns.height = ts;
      gridContainer.addChild(ns);
    }
    proj = null;
    canFire = true;

    process(slot.r, slot.c);

    if (shotsFired > 0 && shotsFired % CONFIG.SHOTS_PER_ROW === 0 && shotsFired !== lastShiftShot) {
      shiftDown();
      lastShiftShot = shotsFired;
    }
  }

  function process(row, col) {
    const cl = flood(row, col);
    if (cl.length >= 3) {
      const fs = popCl(cl);
      score += cl.length * CONFIG.POP_SCORE + fs;
      updateHUD();
      renderGrid();
      checkGO();
    }
    updateHUD();
  }

  function popCl(cl) {
    for (const o of cl) {
      const p = sPos(o.r, o.c);
      const cv = grid[o.r][o.c];
      spawnParts(p.x, p.y, cv);
      grid[o.r][o.c] = null;
    }
    const float = findFloat();
    for (const f of float) {
      const p = sPos(f.r, f.c);
      const cv = grid[f.r][f.c];
      spawnParts(p.x, p.y, cv);
      spawnFall(p.x, p.y, cv);
      grid[f.r][f.c] = null;
    }

    let clearedAll = true;
    for (let r = 0; r < CONFIG.ROWS; r++)
      for (let c = 0; c < CONFIG.COLS; c++)
        if (grid[r][c] !== null) { clearedAll = false; break; }
    if (clearedAll) {
      level++;
      buildGrid();
      renderGrid();
    }

    return float.length * CONFIG.FLOAT_SCORE;
  }

  function spawnFall(x, y, colr) {
    const tex = texForColor(colr);
    if (!tex) return;
    const ts = bubbleRadius * 2;
    const spr = new PIXI.Sprite(tex);
    spr.anchor.set(0.5); spr.x = x; spr.y = y;
    spr.width = ts; spr.height = ts; spr.alpha = 1;
    partContainer.addChild(spr);
    popAnims.push({ spr, ts, vx: (rnd() - 0.5) * 3, vy: 2 + rnd() * 3, rot: (rnd() - 0.5) * 0.1, life: 1, decay: 0.008 + rnd() * 0.008 });
  }

  function checkGO() {
    for (let c = 0; c < CONFIG.COLS; c++) {
      if (grid[CONFIG.ROWS - 1][c] !== null) { showGameOver(); return; }
    }
  }

  function spawnParts(x, y, colr) {
    const cnt = Math.min(8, CONFIG.MAX_PARTICLES - parts.length);
    if (cnt <= 0) return;
    const col = COLOR_VALS[colr] || 0xffffff;
    for (let i = 0; i < cnt; i++) {
      const spr = new PIXI.Sprite(particleTex);
      spr.anchor.set(0.5);
      spr.x = x + (rnd() - 0.5) * 10;
      spr.y = y + (rnd() - 0.5) * 10;
      spr.tint = col;
      spr.scale.set(0.4 + rnd() * 0.4);
      spr.alpha = 1; spr.rotation = rnd() * Math.PI * 2;
      partContainer.addChild(spr);
      parts.push({ spr, vx: (rnd() - 0.5) * 8, vy: -3 + rnd() * 5, rot: (rnd() - 0.5) * 0.3, life: 1, decay: 0.015 + rnd() * 0.02 });
    }
  }

  function updateProj(dt) {
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
  }

  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.spr.x += p.vx * dt; p.spr.y += p.vy * dt;
      p.spr.rotation += p.rot * dt;
      p.vy += 0.15 * dt;
      p.life -= p.decay * dt;
      p.spr.alpha = Math.max(0, p.life);
      p.spr.scale.set(p.life * 0.8);
      if (p.life <= 0) { partContainer.removeChild(p.spr); p.spr.destroy(); parts.splice(i, 1); }
    }
  }

  function updateAnims(dt) {
    for (let i = popAnims.length - 1; i >= 0; i--) {
      const a = popAnims[i];
      a.spr.x += a.vx * dt; a.spr.y += a.vy * dt;
      a.spr.rotation += a.rot * dt;
      a.vy += 0.2 * dt;
      a.life -= a.decay * dt;
      a.spr.alpha = Math.max(0, a.life);
      const s = a.life * a.ts;
      a.spr.width = s; a.spr.height = s;
      if (a.life <= 0) { partContainer.removeChild(a.spr); a.spr.destroy(); popAnims.splice(i, 1); }
    }
  }

  function flashUpdate(dt) {
    if (cannonFlash && cannonFlash.visible) {
      cannonFlash.alpha -= dt * 0.05;
      if (cannonFlash.alpha <= 0) cannonFlash.visible = false;
    }
  }

  function showGameOver() {
    if (state === 'gameover') return;
    state = 'gameover';
    proj = null;
    canFire = true;

    const overlay = new PIXI.Container();
    overlay.name = 'gameoverOverlay';

    const ov = new PIXI.Graphics();
    ov.beginFill(0x000000, 0.75); ov.drawRect(0, 0, W, H); ov.endFill();
    overlay.addChild(ov);

    const gt = new PIXI.Text('GAME OVER', { fontFamily: 'Segoe UI, sans-serif', fontSize: 48, fill: '#ff4444', fontWeight: '900', dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 8, dropShadowDistance: 3 });
    gt.anchor.set(0.5); gt.x = W / 2; gt.y = H * 0.30;
    overlay.addChild(gt);

    const fs = new PIXI.Text('Score: ' + score, { fontFamily: 'Segoe UI, sans-serif', fontSize: 28, fill: '#ffd700', fontWeight: 'bold' });
    fs.anchor.set(0.5); fs.x = W / 2; fs.y = H * 0.40;
    overlay.addChild(fs);

    const fl = new PIXI.Text('Level ' + level, { fontFamily: 'Segoe UI, sans-serif', fontSize: 22, fill: '#fff', fontWeight: 'bold' });
    fl.anchor.set(0.5); fl.x = W / 2; fl.y = H * 0.46;
    overlay.addChild(fl);

    const rbg = new PIXI.Graphics();
    rbg.beginFill(0x4a90d9); rbg.drawRoundedRect(-85, -22, 170, 44, 10); rbg.endFill();
    rbg.x = W / 2; rbg.y = H * 0.56;
    rbg.eventMode = 'static'; rbg.cursor = 'pointer';
    rbg.on('pointerdown', () => {
      gameContainer.removeChild(overlay);
      overlay.destroy({ children: true });
      initActualGameplayLoop();
    });
    overlay.addChild(rbg);

    const rt = new PIXI.Text('RESTART', { fontFamily: 'Segoe UI, sans-serif', fontSize: 20, fill: '#fff', fontWeight: 'bold' });
    rt.anchor.set(0.5); rt.x = W / 2; rt.y = H * 0.56;
    overlay.addChild(rt);

    gameContainer.addChild(overlay);
  }

  function initActualGameplayLoop() {
    console.log("GAME INIT TRIGGERED!");
    state = 'playing';
    score = 0; level = 1; shotsFired = 0; lastShiftShot = 0;
    proj = null; parts = []; popAnims = [];
    gridContainer.removeChildren(true);
    projContainer.removeChildren(true);
    partContainer.removeChildren(true);
    trajContainer.removeChildren(true);
    hudContainer.removeChildren(true);
    calcGrid();
    buildGrid();
    renderGrid();
    const premiumTex = bubbleTextures.premiumPlay || bubbleTextures[CONFIG.BUBBLE_COLORS[0].name];
    setUpCannon(premiumTex);
    createHUD(bubbleTextures);
    canFire = true;
    nextColor = rndNext();
    showNextBubble();
    updateHUD();
  }

  function createMenu(playTex) {
    menuContainer = new PIXI.Container();

    const title = new PIXI.Text('BUBBLE\nSHOOTER', { fontFamily: 'Segoe UI, sans-serif', fontSize: 48, fill: '#fff', fontWeight: '900', align: 'center', dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 8, dropShadowDistance: 3, letterSpacing: 3 });
    title.anchor.set(0.5); title.x = W / 2; title.y = H * 0.28;
    menuContainer.addChild(title);

    const playButton = new PIXI.Sprite(playTex);
    playButton.anchor.set(0.5);
    playButton.x = W / 2;
    playButton.y = H * 0.55;
    const btnSize = Math.min(W * 0.4, 140);
    playButton.width = btnSize;
    playButton.height = btnSize;
    playButton.eventMode = 'static';
    playButton.cursor = 'pointer';
    playButton.hitArea = new PIXI.Rectangle(
      -playButton.texture.orig.width / 2,
      -playButton.texture.orig.height / 2,
      playButton.texture.orig.width,
      playButton.texture.orig.height
    );
    playButton.on('pointerdown', (e) => {
      console.log("GAME INIT TRIGGERED!");
      menuContainer.visible = false;
      menuContainer.interactiveChildren = false;
      gameContainer.visible = true;
      initActualGameplayLoop();
    });
    menuContainer.addChild(playButton);

    const hint = new PIXI.Text('Tap to Play', { fontFamily: 'Segoe UI, sans-serif', fontSize: 16, fill: '#fff', fontWeight: '300', dropShadow: true, dropShadowColor: '#000', dropShadowBlur: 3 });
    hint.anchor.set(0.5); hint.x = W / 2; hint.y = H * 0.66;
    menuContainer.addChild(hint);

    app.stage.addChild(menuContainer);
  }

  function loop(dt) {
    if (state === 'playing') {
      updateCannon();
      drawTraj();
      updateProj(dt);
      updateParts(dt);
      updateAnims(dt);
      flashUpdate(dt);
    } else {
      updateParts(dt);
      updateAnims(dt);
    }
  }

  function buildManifest() {
    const m = { background: 'backgraund.jpg' };
    for (const bc of CONFIG.BUBBLE_COLORS) m[bc.name] = IMG + bc.file;
    m.special = IMG + CONFIG.BUBBLE_SPECIAL.file;
    m.air = IMG + CONFIG.BUBBLE_AIR.file;
    m.premiumPlay = IMG + CONFIG.UI.premiumPlay;
    m.backBtn = IMG + CONFIG.UI.back;
    m.pauseBtn = IMG + CONFIG.UI.pause;
    m.playBtn = IMG + CONFIG.UI.play;
    m.scoreBar = IMG + CONFIG.UI.premiumPlay;
    return m;
  }

  async function loadAllAssets() {
    const manifest = buildManifest();
    const keys = Object.keys(manifest);
    let loaded = 0;
    const results = {};
    for (const key of keys) {
      try {
        results[key] = await PIXI.Assets.load(manifest[key]);
      } catch (e) {
        console.warn('Load fail:', manifest[key], e);
        const g = new PIXI.Graphics();
        g.beginFill(COLOR_VALS[loaded % COLOR_VALS.length] || 0xffffff);
        g.drawCircle(0, 0, 28);
        g.endFill();
        results[key] = app.renderer.generateTexture(g);
        g.destroy();
      }
      loaded++;
      if (loadingText) loadingText.text = 'Loading ' + Math.floor((loaded / keys.length) * 100) + '%';
    }
    return results;
  }

  let loadingText;

  function mkParticleTex() {
    const g = new PIXI.Graphics();
    g.beginFill(0xffffff); g.drawCircle(0, 0, 8); g.endFill();
    particleTex = app.renderer.generateTexture(g);
    g.destroy();
  }

  async function init() {
    app = new PIXI.Application({ width: W, height: H, backgroundColor: 0x0a0a1a, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
    document.getElementById('game-container').appendChild(app.view);
    window.addEventListener('resize', resize);
    resize();

    loadingText = new PIXI.Text('Loading 0%', { fontFamily: 'Segoe UI, sans-serif', fontSize: 32, fill: '#fff', fontWeight: 'bold' });
    loadingText.anchor.set(0.5); loadingText.x = W / 2; loadingText.y = H / 2;
    app.stage.addChild(loadingText);

    mkParticleTex();

    const textures = await loadAllAssets();
    bubbleTextures = {};
    for (const bc of CONFIG.BUBBLE_COLORS) bubbleTextures[bc.name] = textures[bc.name] || textures[Object.keys(textures)[0]];
    bubbleTextures.special = textures.special || bubbleTextures[CONFIG.BUBBLE_COLORS[0].name];
    bubbleTextures.air = textures.air || bubbleTextures[CONFIG.BUBBLE_COLORS[0].name];
    bubbleTextures.premiumPlay = textures.premiumPlay;
    bubbleTextures.scoreBar = textures.scoreBar;

    loadingText.destroy();
    loadingText = null;

    bgSprite = new PIXI.Sprite(textures.background);
    bgSprite.width = app.screen.width;
    bgSprite.height = app.screen.height;

    gameContainer = new PIXI.Container();
    gameContainer.visible = false;

    app.stage.addChild(bgSprite);
    app.stage.addChild(gameContainer);

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
    ptrLayer.on('pointermove', e => { pointerX = e.global.x; pointerY = e.global.y; });
    ptrLayer.on('pointerdown', e => {
      pointerX = e.global.x; pointerY = e.global.y;
      if (state === 'playing') fire();
    });
    gameContainer.addChild(ptrLayer);

    const menuTex = textures.premiumPlay || textures.playBtn;
    createMenu(menuTex);

    app.ticker.add(d => loop(d));
  }

  init().catch(console.error);
})();