import { PNG } from 'pngjs';
import fs from 'fs';

const W = 640;
const H = 800;
const outDir = 'public/assets';

// Helper: create a new RGBA PNG
function createPNG(w, h) {
  const png = new PNG({ width: w, height: h });
  // fill with transparent (all zeros)
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0;     // R
    png.data[i+1] = 0;   // G
    png.data[i+2] = 0;   // B
    png.data[i+3] = 0;   // A = 0 transparent
  }
  return png;
}

function setPixel(png, x, y, r, g, b, a) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (y * png.width + x) * 4;
  png.data[idx] = r;
  png.data[idx+1] = g;
  png.data[idx+2] = b;
  png.data[idx+3] = a;
}

function fillRect(png, x, y, w, h, r, g, b, a) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(png, px, py, r, g, b, a);
    }
  }
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

function fillCircle(png, cx, cy, radius, r, g, b, a) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(png.width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(png.height - 1, Math.ceil(cy + radius));
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      if (dist(px, py, cx, cy) <= radius) {
        const alpha = a;
        setPixel(png, px, py, r, g, b, alpha);
      }
    }
  }
}

function fillRoundedRect(png, x, y, w, h, rad, r, g, b, a) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      // Check if in corner radius zones
      let inShape = true;
      if (px < x + rad && py < y + rad) {
        inShape = dist(px, py, x + rad, y + rad) <= rad;
      } else if (px > x + w - rad && py < y + rad) {
        inShape = dist(px, py, x + w - rad, y + rad) <= rad;
      } else if (px < x + rad && py > y + h - rad) {
        inShape = dist(px, py, x + rad, y + h - rad) <= rad;
      } else if (px > x + w - rad && py > y + h - rad) {
        inShape = dist(px, py, x + w - rad, y + h - rad) <= rad;
      }
      if (inShape) {
        setPixel(png, px, py, r, g, b, a);
      }
    }
  }
}

function fillDiamond(png, cx, cy, size, r, g, b, a) {
  const minX = Math.max(0, Math.floor(cx - size));
  const maxX = Math.min(png.width - 1, Math.ceil(cx + size));
  const minY = Math.max(0, Math.floor(cy - size));
  const maxY = Math.min(png.height - 1, Math.ceil(cy + size));
  const hw = size;
  const hh = size;
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dx = Math.abs(px - cx);
      const dy = Math.abs(py - cy);
      if (dx / hw + dy / hh <= 1) {
        setPixel(png, px, py, r, g, b, a);
      }
    }
  }
}

function savePNG(png, name) {
  const buf = PNG.sync.write(png);
  fs.writeFileSync(`${outDir}/${name}`, buf);
  console.log(`✓ ${name}`);
}

// ==================== ASSETS ====================

function genPlayButton() {
  const png = createPNG(300, 64);
  fillRoundedRect(png, 0, 0, 300, 64, 28, 0xFF, 0x3B, 0x30, 255);
  // top highlight
  fillRoundedRect(png, 8, 6, 284, 20, 10, 0xFF, 0xFF, 0xFF, 20);
  // inner lighter band
  fillRect(png, 4, 4, 292, 28, 0xFF, 0x8C, 0x00, 38);
  savePNG(png, 'play_button.png');
}

function genPlayButtonShadow() {
  const png = createPNG(300, 64);
  fillRoundedRect(png, 2, 2, 300, 64, 28, 0xC3, 0x27, 0x00, 102);
  savePNG(png, 'play_button_shadow.png');
}

function genDailyButton() {
  const w = W - 60;
  const png = createPNG(w, 52);
  fillRoundedRect(png, 0, 0, w, 52, 14, 0x00, 0x7A, 0xFF, 255);
  fillRoundedRect(png, 6, 4, w - 12, 22, 8, 0xFF, 0xFF, 0xFF, 20);
  savePNG(png, 'daily_button.png');
}

function genAdventureButton() {
  const w = W - 60;
  const png = createPNG(w, 52);
  fillRoundedRect(png, 0, 0, w, 52, 14, 0x34, 0xC7, 0x59, 255);
  fillRoundedRect(png, 6, 4, w - 12, 22, 8, 0xFF, 0xFF, 0xFF, 20);
  savePNG(png, 'adventure_button.png');
}

function genBadgeNew() {
  const png = createPNG(40, 20);
  fillRoundedRect(png, 0, 0, 40, 20, 10, 0xFF, 0x3B, 0x30, 255);
  savePNG(png, 'badge_new.png');
}

function genHSPanel() {
  const png = createPNG(200, 50);
  fillRoundedRect(png, 0, 0, 200, 50, 12, 0x00, 0x00, 0x00, 51);
  savePNG(png, 'hs_panel.png');
}

function genHeaderBg() {
  const w = W - 20;
  const png = createPNG(w, 52);
  fillRoundedRect(png, 0, 0, w, 52, 16, 0x00, 0x00, 0x00, 89);
  savePNG(png, 'header_bg.png');
}

function genFooterBg() {
  const png = createPNG(W, 60);
  fillRect(png, 0, 0, W, 60, 10, 4, 24, 247);
  fillRect(png, 0, 0, W, 1, 58, 32, 96, 76);
  savePNG(png, 'footer_bg.png');
}

function genGlowCircle() {
  const s = 240;
  const png = createPNG(s, s);
  const cx = s / 2, cy = s / 2;
  for (let i = 3; i >= 0; i--) {
    const radius = 100 + i * 20;
    const alpha = Math.max(0, 0.03 - i * 0.005);
    if (alpha <= 0) continue;
    fillCircle(png, cx, cy, radius, 0xFF, 0xCC, 0x00, Math.round(alpha * 255));
  }
  savePNG(png, 'glow_circle.png');
}

function genCoinIcon() {
  const s = 32;
  const png = createPNG(s, s);
  const cx = s / 2, cy = s / 2;
  fillCircle(png, cx, cy, 12, 0xFF, 0xD7, 0x00, 255);
  fillCircle(png, cx, cy, 6, 0xFF, 0xA5, 0x00, 102);
  savePNG(png, 'coin_icon.png');
}

function genDiamondIcon() {
  const s = 24;
  const png = createPNG(s, s);
  fillDiamond(png, s / 2, s / 2, 9, 0x00, 0xBF, 0xFF, 255);
  // highlight triangle
  for (let py = 0; py < s; py++) {
    for (let px = 0; px < s; px++) {
      const cx = s / 2, cy = s / 2;
      const dx = px - cx, dy = py - cy;
      if (dx >= 0 && dy <= 0 && Math.abs(dx) / 9 + Math.abs(dy) / 9 <= 1) {
        const idx = (py * s + px) * 4;
        png.data[idx] = Math.min(255, png.data[idx] + 60);
        png.data[idx+1] = Math.min(255, png.data[idx+1] + 60);
        png.data[idx+2] = Math.min(255, png.data[idx+2] + 60);
        png.data[idx+3] = Math.min(255, png.data[idx+3] + 40);
      }
    }
  }
  savePNG(png, 'diamond_icon.png');
}

function genSettingsIcon() {
  const s = 28;
  const png = createPNG(s, s);
  const cx = s / 2, cy = s / 2;
  // outer circle
  for (let py = 0; py < s; py++) {
    for (let px = 0; px < s; px++) {
      const d = dist(px, py, cx, cy);
      if (d >= 7 && d <= 9) {
        setPixel(png, px, py, 0x55, 0x55, 0x55, 255);
      }
    }
  }
  // inner glow
  fillCircle(png, cx, cy, 6, 0xFF, 0xFF, 0xFF, 40);
  savePNG(png, 'settings_icon.png');
}

function genBgGradient() {
  const png = createPNG(W, H);
  const colors = [
    [0x1E, 0x10, 0x40],
    [0x1C, 0x0E, 0x38],
    [0x1A, 0x0C, 0x30],
    [0x17, 0x0A, 0x28],
    [0x13, 0x08, 0x20],
    [0x0F, 0x06, 0x18],
  ];
  const bandH = Math.ceil(H / colors.length);
  for (let i = 0; i < colors.length; i++) {
    const [r, g, b] = colors[i];
    fillRect(png, 0, i * bandH, W, bandH + 2, r, g, b, 255);
  }
  savePNG(png, 'bg_gradient.png');
}

// ==================== RUN ====================

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

genPlayButton();
genPlayButtonShadow();
genDailyButton();
genAdventureButton();
genBadgeNew();
genHSPanel();
genHeaderBg();
genFooterBg();
genGlowCircle();
genCoinIcon();
genDiamondIcon();
genSettingsIcon();
genBgGradient();

console.log(`\n✅ All assets generated in ${outDir}/`);
