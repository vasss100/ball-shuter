import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

const FONT = 'Outfit, Arial, sans-serif';

export class HomePage {
  constructor(app, container, callbacks) {
    this.app = app;
    this.container = container;
    this.callbacks = callbacks;
    this.visible = true;
    this._logoTime = 0;

    this._loaded = false;

    this._build();
    this._loaded = true;
    if (this._pendingShow) {
      this.container.visible = true;
      this.visible = true;
    }
  }

  _build() {
    this._drawBackground();
    this._drawStars();
    this._buildHeader();
    this._buildLogo();
    this._buildScorePanel();
    this._buildPlayButton();
    this._buildDailyButton();
    this._buildAdventureButton();
    this._buildFooter();
  }

  _drawBackground() {
    const bg = new PIXI.Graphics();
    const colors = [0x1E1040, 0x1C0E38, 0x1A0C30, 0x170A28, 0x130820, 0x0F0618];
    const bandH = Math.ceil(GAME_HEIGHT / colors.length);
    colors.forEach((c, i) => {
      bg.beginFill(c);
      bg.drawRect(0, i * bandH, GAME_WIDTH, bandH + 2);
      bg.endFill();
    });
    this.container.addChild(bg);
  }

  _drawStars() {
    for (let i = 0; i < 50; i++) {
      const dot = new PIXI.Graphics();
      dot.beginFill(0xFFFFFF, 0.08 + Math.random() * 0.12);
      dot.drawCircle(0, 0, 1 + Math.random() * 2);
      dot.endFill();
      dot.x = Math.random() * GAME_WIDTH;
      dot.y = Math.random() * GAME_HEIGHT * 0.6;
      this.container.addChild(dot);
    }
  }

  _buildHeader() {
    const header = new PIXI.Graphics();
    header.beginFill(0x000000, 0.35);
    header.drawRoundedRect(0, 0, GAME_WIDTH - 20, 52, 16);
    header.endFill();
    header.x = 10;
    header.y = 8;
    this.container.addChild(header);

    const coin = new PIXI.Graphics();
    coin.beginFill(0xFFD700);
    coin.drawCircle(0, 0, 12);
    coin.endFill();
    coin.beginFill(0xFFA500, 0.4);
    coin.drawCircle(0, 0, 6);
    coin.endFill();
    coin.x = 22 + 12;
    coin.y = 18 + 12;
    this.container.addChild(coin);

    this._coinText = new PIXI.Text('1250', {
      fontFamily: FONT, fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._coinText.x = 46;
    this._coinText.y = 22;
    this.container.addChild(this._coinText);

    const diamond = new PIXI.Graphics();
    diamond.beginFill(0x00BFFF);
    diamond.moveTo(0, -9);
    diamond.lineTo(9, 0);
    diamond.lineTo(0, 9);
    diamond.lineTo(-9, 0);
    diamond.closePath();
    diamond.endFill();
    diamond.x = 110 + 12;
    diamond.y = 21 + 12;
    this.container.addChild(diamond);

    this._diamondText = new PIXI.Text('85', {
      fontFamily: FONT, fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._diamondText.x = 130;
    this._diamondText.y = 22;
    this.container.addChild(this._diamondText);

    const gear = new PIXI.Graphics();
    gear.lineStyle(2, 0x555555);
    gear.drawCircle(0, 0, 8);
    gear.beginFill(0xFFFFFF, 0.15);
    gear.drawCircle(0, 0, 6);
    gear.endFill();
    gear.x = GAME_WIDTH - 42 + 8;
    gear.y = 20 + 8;
    gear.eventMode = 'static';
    gear.cursor = 'pointer';
    gear.on('pointerdown', () => {
      if (this.callbacks.onSettings) this.callbacks.onSettings();
    });
    this.container.addChild(gear);
  }

  _buildLogo() {
    const glow = new PIXI.Graphics();
    for (let i = 3; i >= 0; i--) {
      const radius = 100 + i * 20;
      const alpha = Math.max(0, 0.03 - i * 0.005);
      if (alpha <= 0) continue;
      glow.beginFill(0xFFCC00, alpha);
      glow.drawCircle(0, 0, radius);
      glow.endFill();
    }
    glow.x = GAME_WIDTH / 2;
    glow.y = 120;
    this.container.addChild(glow);

    this._logo = new PIXI.Text('BLOCK BLAST', {
      fontFamily: FONT, fontSize: 54, fill: 0xFFCC00, fontWeight: '900',
      stroke: 0x000000, strokeThickness: 5,
    });
    this._logo.anchor.set(0.5);
    this._logo.x = GAME_WIDTH / 2;
    this._logoBaseY = 118;
    this._logo.y = this._logoBaseY;
    this.container.addChild(this._logo);

    const sub = new PIXI.Text('500 LEVELS', {
      fontFamily: FONT, fontSize: 12, fill: 0x999999,
    });
    sub.anchor.set(0.5);
    sub.x = GAME_WIDTH / 2;
    sub.y = 152;
    this.container.addChild(sub);
  }

  _buildScorePanel() {
    const panel = new PIXI.Graphics();
    panel.beginFill(0x000000, 0.2);
    panel.drawRoundedRect(0, 0, 200, 50, 12);
    panel.endFill();
    panel.x = GAME_WIDTH / 2 - 100;
    panel.y = 185;
    this.container.addChild(panel);

    const crown = new PIXI.Text('👑', {
      fontFamily: 'Arial, sans-serif', fontSize: 16,
    });
    crown.anchor.set(0.5);
    crown.x = GAME_WIDTH / 2 - 70;
    crown.y = 203;
    this.container.addChild(crown);

    const hsLbl = new PIXI.Text('BEST SCORE', {
      fontFamily: FONT, fontSize: 10, fill: 0x888888,
    });
    hsLbl.anchor.set(0.5);
    hsLbl.x = GAME_WIDTH / 2 + 10;
    hsLbl.y = 196;
    this.container.addChild(hsLbl);

    this._hsValue = new PIXI.Text('0', {
      fontFamily: FONT, fontSize: 22, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._hsValue.anchor.set(0.5);
    this._hsValue.x = GAME_WIDTH / 2 + 10;
    this._hsValue.y = 220;
    this.container.addChild(this._hsValue);
  }

  _buildPlayButton() {
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0xC32700, 0.4);
    shadow.drawRoundedRect(0, 0, 300, 64, 28);
    shadow.endFill();
    shadow.x = GAME_WIDTH / 2 - 150;
    shadow.y = 272;
    this.container.addChild(shadow);

    this._playBtn = new PIXI.Graphics();
    this._playBtn.beginFill(0xFF3B30);
    this._playBtn.drawRoundedRect(0, 0, 300, 64, 28);
    this._playBtn.endFill();
    this._playBtn.beginFill(0xFFFFFF, 0.08);
    this._playBtn.drawRoundedRect(8, 6, 284, 20, 10);
    this._playBtn.endFill();
    this._playBtn.beginFill(0xFF8C00, 0.15);
    this._playBtn.drawRect(4, 4, 292, 28);
    this._playBtn.endFill();
    this._playBtn.x = GAME_WIDTH / 2 - 150;
    this._playBtn.y = 268;
    this._playBtn.eventMode = 'static';
    this._playBtn.cursor = 'pointer';
    this._playBtn.on('pointerdown', () => {
      if (this.callbacks.onPlay) this.callbacks.onPlay();
    });
    this._playBtn.on('pointerover', () => { this._playBtn.alpha = 0.9; });
    this._playBtn.on('pointerout', () => { this._playBtn.alpha = 1; });
    this.container.addChild(this._playBtn);

    const playTxt = new PIXI.Text('PLAY', {
      fontFamily: FONT, fontSize: 32, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    playTxt.anchor.set(0.5);
    playTxt.x = GAME_WIDTH / 2;
    playTxt.y = 300;
    this.container.addChild(playTxt);
  }

  _buildDailyButton() {
    const btn = new PIXI.Graphics();
    btn.beginFill(0x007AFF);
    btn.drawRoundedRect(0, 0, GAME_WIDTH - 60, 52, 14);
    btn.endFill();
    btn.beginFill(0xFFFFFF, 0.08);
    btn.drawRoundedRect(6, 4, GAME_WIDTH - 72, 22, 8);
    btn.endFill();
    btn.x = 30;
    btn.y = 358;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      if (this.callbacks.onDaily) this.callbacks.onDaily();
    });
    this.container.addChild(btn);

    const star = new PIXI.Graphics();
    star.beginFill(0xFFD700);
    star.drawCircle(0, 0, 8);
    star.endFill();
    star.beginFill(0xFFA500, 0.4);
    star.drawCircle(0, 0, 4);
    star.endFill();
    star.width = 20;
    star.height = 20;
    star.x = 48 + 10;
    star.y = 374 + 10;
    this.container.addChild(star);

    const txt = new PIXI.Text('DAILY CHALLENGE', {
      fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    txt.anchor.set(0.5);
    txt.x = GAME_WIDTH / 2;
    txt.y = 384;
    this.container.addChild(txt);

    const badge = new PIXI.Graphics();
    badge.beginFill(0xFF3B30);
    badge.drawRoundedRect(0, 0, 40, 20, 10);
    badge.endFill();
    badge.x = GAME_WIDTH - 80;
    badge.y = 374;
    this.container.addChild(badge);

    const badgeTxt = new PIXI.Text('NEW', {
      fontFamily: FONT, fontSize: 10, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    badgeTxt.anchor.set(0.5);
    badgeTxt.x = 20;
    badgeTxt.y = 10;
    badge.addChild(badgeTxt);
  }

  _buildAdventureButton() {
    const btn = new PIXI.Graphics();
    btn.beginFill(0x34C759);
    btn.drawRoundedRect(0, 0, GAME_WIDTH - 60, 52, 14);
    btn.endFill();
    btn.beginFill(0xFFFFFF, 0.08);
    btn.drawRoundedRect(6, 4, GAME_WIDTH - 72, 22, 8);
    btn.endFill();
    btn.x = 30;
    btn.y = 425;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      if (this.callbacks.onAdventure) this.callbacks.onAdventure();
    });
    this.container.addChild(btn);

    const icon = new PIXI.Graphics();
    icon.beginFill(0x00BFFF);
    icon.moveTo(0, -7);
    icon.lineTo(7, 0);
    icon.lineTo(0, 7);
    icon.lineTo(-7, 0);
    icon.closePath();
    icon.endFill();
    icon.width = 20;
    icon.height = 20;
    icon.x = 48 + 10;
    icon.y = 441 + 10;
    this.container.addChild(icon);

    const txt = new PIXI.Text('ADVENTURE', {
      fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    txt.anchor.set(0.5);
    txt.x = GAME_WIDTH / 2;
    txt.y = 451;
    this.container.addChild(txt);
  }

  _buildFooter() {
    const footerY = GAME_HEIGHT - 60;
    const footer = new PIXI.Graphics();
    footer.beginFill(0x0A0418, 0.97);
    footer.drawRect(0, 0, GAME_WIDTH, 60);
    footer.endFill();
    footer.beginFill(0x3A2060, 0.3);
    footer.drawRect(0, 0, GAME_WIDTH, 1);
    footer.endFill();
    footer.y = footerY;
    this.container.addChild(footer);

    const ACCENT = 0xFFCC00;
    const tabs = [
      { label: 'Shop', icon: '🛒', active: false },
      { label: 'Leaderboard', icon: '🏆', active: true },
      { label: 'Home', icon: '🏠', active: false },
      { label: 'Skins', icon: '🎨', active: false },
      { label: 'Events', icon: '🎁', active: false },
    ];
    const tw = GAME_WIDTH / tabs.length;

    tabs.forEach((tab, i) => {
      const c = new PIXI.Container();
      c.x = i * tw;
      c.y = footerY + 5;

      const color = tab.active ? ACCENT : 0x555555;

      const ic = new PIXI.Text(tab.icon, {
        fontFamily: 'Arial, sans-serif', fontSize: 18, fill: color,
      });
      ic.anchor.set(0.5);
      ic.x = tw / 2;
      ic.y = 14;
      c.addChild(ic);

      const lb = new PIXI.Text(tab.label, {
        fontFamily: FONT, fontSize: 10, fill: color,
      });
      lb.anchor.set(0.5);
      lb.x = tw / 2;
      lb.y = 35;
      c.addChild(lb);

      if (tab.active) {
        const dot = new PIXI.Graphics();
        dot.beginFill(ACCENT);
        dot.drawRoundedRect(tw / 2 - 10, 46, 20, 3, 2);
        dot.endFill();
        c.addChild(dot);
      }

      if (this.callbacks.onTab) {
        c.eventMode = 'static';
        c.cursor = 'pointer';
        c.on('pointerdown', () => this.callbacks.onTab(tab.label));
      }

      this.container.addChild(c);
    });
  }

  updateHighScore(score) {
    this._hsValue.text = `${score}`;
  }

  show() {
    if (!this._loaded) {
      this._pendingShow = true;
      return;
    }
    this.container.visible = true;
    this.visible = true;
  }

  hide() {
    this.container.visible = false;
    this.visible = false;
    this._pendingShow = false;
  }

  update(delta) {
    if (!this.visible || !this._loaded) return;
    this._logoTime += delta * 0.03;
    this._logo.y = this._logoBaseY + Math.sin(this._logoTime) * 4;
  }

  destroy() {
  }
}
