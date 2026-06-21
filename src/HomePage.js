import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

const FONT = 'Outfit, Arial, sans-serif';

const ASSETS = {
  playBtn: '/assets/play_button.png',
  playBtnShadow: '/assets/play_button_shadow.png',
  dailyBtn: '/assets/daily_button.png',
  adventureBtn: '/assets/adventure_button.png',
  badgeNew: '/assets/badge_new.png',
  hsPanel: '/assets/hs_panel.png',
  headerBg: '/assets/header_bg.png',
  footerBg: '/assets/footer_bg.png',
  glowCircle: '/assets/glow_circle.png',
  coinIcon: '/assets/coin_icon.png',
  diamondIcon: '/assets/diamond_icon.png',
  settingsIcon: '/assets/settings_icon.png',
  bgGradient: '/assets/bg_gradient.png',
};

export class HomePage {
  constructor(app, container, callbacks) {
    this.app = app;
    this.container = container;
    this.callbacks = callbacks;
    this.visible = true;
    this._logoTime = 0;

    this._textures = {};
    this._loaded = false;

    this._loadAssets().then(() => {
      this._build();
      this._loaded = true;
      if (this._pendingShow) {
        this.container.visible = true;
        this.visible = true;
      }
    });
  }

  async _loadAssets() {
    const loader = PIXI.Assets;
    // Register all asset URLs
    const urls = Object.values(ASSETS);
    for (const url of urls) {
      loader.add(url, url);
    }
    const textures = await loader.load(urls);
    this._textures = textures;
  }

  _build() {
    const t = this._textures;

    this._bg = new PIXI.Sprite(t[ASSETS.bgGradient]);
    this.container.addChild(this._bg);

    this._drawStars();
    this._buildHeader(t);
    this._buildLogo(t);
    this._buildScorePanel(t);
    this._buildPlayButton(t);
    this._buildDailyButton(t);
    this._buildAdventureButton(t);
    this._buildFooter(t);
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

  _buildHeader(t) {
    const header = new PIXI.Sprite(t[ASSETS.headerBg]);
    header.x = 10;
    header.y = 8;
    this.container.addChild(header);

    const coin = new PIXI.Sprite(t[ASSETS.coinIcon]);
    coin.x = 22;
    coin.y = 18;
    this.container.addChild(coin);

    this._coinText = new PIXI.Text('1250', {
      fontFamily: FONT, fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._coinText.x = 46;
    this._coinText.y = 22;
    this.container.addChild(this._coinText);

    const diamond = new PIXI.Sprite(t[ASSETS.diamondIcon]);
    diamond.x = 110;
    diamond.y = 21;
    this.container.addChild(diamond);

    this._diamondText = new PIXI.Text('85', {
      fontFamily: FONT, fontSize: 15, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._diamondText.x = 130;
    this._diamondText.y = 22;
    this.container.addChild(this._diamondText);

    const gear = new PIXI.Sprite(t[ASSETS.settingsIcon]);
    gear.x = GAME_WIDTH - 42;
    gear.y = 20;
    gear.eventMode = 'static';
    gear.cursor = 'pointer';
    gear.on('pointerdown', () => {
      if (this.callbacks.onSettings) this.callbacks.onSettings();
    });
    this.container.addChild(gear);
  }

  _buildLogo(t) {
    const glow = new PIXI.Sprite(t[ASSETS.glowCircle]);
    glow.anchor.set(0.5);
    glow.x = GAME_WIDTH / 2;
    glow.y = 120;
    glow.alpha = 0.6;
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

  _buildScorePanel(t) {
    const panel = new PIXI.Sprite(t[ASSETS.hsPanel]);
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

  _buildPlayButton(t) {
    const shadow = new PIXI.Sprite(t[ASSETS.playBtnShadow]);
    shadow.x = GAME_WIDTH / 2 - 150;
    shadow.y = 272;
    this.container.addChild(shadow);

    this._playBtn = new PIXI.Sprite(t[ASSETS.playBtn]);
    this._playBtn.x = GAME_WIDTH / 2 - 150;
    this._playBtn.y = 268;
    this._playBtn.eventMode = 'static';
    this._playBtn.cursor = 'pointer';
    this._playBtn.on('pointerdown', () => {
      if (this.callbacks.onPlay) this.callbacks.onPlay();
    });
    this._playBtn.on('pointerover', () => { this._playBtn.tint = 0xDDDDDD; });
    this._playBtn.on('pointerout', () => { this._playBtn.tint = 0xFFFFFF; });
    this.container.addChild(this._playBtn);

    const playTxt = new PIXI.Text('PLAY', {
      fontFamily: FONT, fontSize: 32, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    playTxt.anchor.set(0.5);
    playTxt.x = GAME_WIDTH / 2;
    playTxt.y = 300;
    this.container.addChild(playTxt);
  }

  _buildDailyButton(t) {
    const btn = new PIXI.Sprite(t[ASSETS.dailyBtn]);
    btn.x = 30;
    btn.y = 358;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      if (this.callbacks.onDaily) this.callbacks.onDaily();
    });
    this.container.addChild(btn);

    const star = new PIXI.Sprite(t[ASSETS.coinIcon]);
    star.width = 20;
    star.height = 20;
    star.x = 48;
    star.y = 374;
    this.container.addChild(star);

    const txt = new PIXI.Text('DAILY CHALLENGE', {
      fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    txt.anchor.set(0.5);
    txt.x = GAME_WIDTH / 2;
    txt.y = 384;
    this.container.addChild(txt);

    const badge = new PIXI.Sprite(t[ASSETS.badgeNew]);
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

  _buildAdventureButton(t) {
    const btn = new PIXI.Sprite(t[ASSETS.adventureBtn]);
    btn.x = 30;
    btn.y = 425;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      if (this.callbacks.onAdventure) this.callbacks.onAdventure();
    });
    this.container.addChild(btn);

    const icon = new PIXI.Sprite(t[ASSETS.diamondIcon]);
    icon.width = 20;
    icon.height = 20;
    icon.x = 48;
    icon.y = 441;
    this.container.addChild(icon);

    const txt = new PIXI.Text('ADVENTURE', {
      fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    txt.anchor.set(0.5);
    txt.x = GAME_WIDTH / 2;
    txt.y = 451;
    this.container.addChild(txt);
  }

  _buildFooter(t) {
    const footerY = GAME_HEIGHT - 60;
    const footer = new PIXI.Sprite(t[ASSETS.footerBg]);
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
    for (const key in this._textures) {
      this._textures[key].destroy(true);
    }
  }
}
