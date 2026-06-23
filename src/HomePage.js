import * as PIXI from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, UI_ASSETS } from './constants.js';

const FONT = 'Outfit, Arial, sans-serif';

export class HomePage {
  constructor(app, parentContainer, callbacks) {
    this.app = app;
    this.parentContainer = parentContainer;
    this.container = new PIXI.Container();
    this.parentContainer.addChild(this.container);
    this.callbacks = callbacks;
    this.visible = true;
    this._logoTime = 0;
    this._soundOn = true;
    this._musicOn = true;
    this._loaded = false;

    const saved = parseInt(localStorage.getItem('blockblast_coins') || '1250', 10);
    this._coinTarget = saved;
    this._coinDisplay = saved;

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
    this._buildCenterIcons();
    this._buildPlayButton();
    this._buildSettingsPopup();
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
    const headerBg = new PIXI.Graphics();
    headerBg.beginFill(0x000000, 0.35);
    headerBg.drawRoundedRect(0, 0, GAME_WIDTH - 20, 52, 16);
    headerBg.endFill();
    headerBg.x = 10;
    headerBg.y = 8;
    this.container.addChild(headerBg);

    try {
      const levelSelect = PIXI.Sprite.from(UI_ASSETS.levelSelect);
      levelSelect.width = 28;
      levelSelect.height = 28;
      levelSelect.x = 20;
      levelSelect.y = 20;
      this.container.addChild(levelSelect);
    } catch {}

    this._levelText = new PIXI.Text('LV.1', {
      fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._levelText.x = 54;
    this._levelText.y = 24;
    this.container.addChild(this._levelText);

    try {
      const trophy = PIXI.Sprite.from(UI_ASSETS.trophy);
      trophy.width = 24;
      trophy.height = 24;
      trophy.x = GAME_WIDTH - 160;
      trophy.y = 22;
      this.container.addChild(trophy);
    } catch {}

    this._hsValue = new PIXI.Text('0', {
      fontFamily: FONT, fontSize: 14, fill: 0xFFD700, fontWeight: 'bold',
    });
    this._hsValue.x = GAME_WIDTH - 130;
    this._hsValue.y = 24;
    this.container.addChild(this._hsValue);

    try {
      const coin = PIXI.Sprite.from(UI_ASSETS.coin);
      coin.width = 24;
      coin.height = 24;
      coin.x = GAME_WIDTH - 80;
      coin.y = 22;
      this.container.addChild(coin);
    } catch {}

    this._coinText = new PIXI.Text('1250', {
      fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    this._coinText.x = GAME_WIDTH - 50;
    this._coinText.y = 24;
    this.container.addChild(this._coinText);

    const settingsBg = new PIXI.Graphics();
    settingsBg.beginFill(0x000000, 0.25);
    settingsBg.drawCircle(0, 0, 16);
    settingsBg.endFill();
    settingsBg.x = GAME_WIDTH - 80;
    settingsBg.y = 66;
    this.container.addChild(settingsBg);

    try {
      const settings = PIXI.Sprite.from(UI_ASSETS.settings);
      settings.anchor.set(0.5);
      const sz = Math.max(settings.texture.orig.width, settings.texture.orig.height);
      settings.scale.set(28 / sz);
      settings.x = GAME_WIDTH - 80;
      settings.y = 66;
      settings.eventMode = 'static';
      settings.cursor = 'pointer';
      settings.on('pointerdown', () => this._showSettings());
      this.container.addChild(settings);
    } catch {}
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
    glow.y = GAME_HEIGHT * 0.28;
    this.container.addChild(glow);

    this._logo = new PIXI.Text('BLOCK BLAST', {
      fontFamily: FONT, fontSize: 48, fill: 0xFFCC00, fontWeight: '900',
      stroke: 0x000000, strokeThickness: 5,
    });
    this._logo.anchor.set(0.5);
    this._logo.x = GAME_WIDTH / 2;
    this._logoBaseY = GAME_HEIGHT * 0.27;
    this._logo.y = this._logoBaseY;
    this.container.addChild(this._logo);

    const sub = new PIXI.Text('500 LEVELS', {
      fontFamily: FONT, fontSize: 12, fill: 0x999999,
    });
    sub.anchor.set(0.5);
    sub.x = GAME_WIDTH / 2;
    sub.y = GAME_HEIGHT * 0.27 + 34;
    this.container.addChild(sub);
  }

  _buildCenterIcons() {
    const iconY = GAME_HEIGHT * 0.46;
    const iconSize = 40;

    const addIcon = (assetKey, xPos, onClick) => {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x000000, 0.25);
      bg.drawCircle(0, 0, 24);
      bg.endFill();
      bg.x = xPos;
      bg.y = iconY;
      this.container.addChild(bg);

      try {
        const sprite = PIXI.Sprite.from(assetKey);
        sprite.anchor.set(0.5);
        const sz = Math.max(sprite.texture.orig.width, sprite.texture.orig.height);
        sprite.scale.set(iconSize / sz);
        sprite.x = xPos;
        sprite.y = iconY;
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', onClick);
        this.container.addChild(sprite);
      } catch {}
    };

    addIcon(UI_ASSETS.speaker, GAME_WIDTH / 2, () => {
      this._soundOn = !this._soundOn;
    });
  }

  _buildPlayButton() {
    try {
      const playSprite = PIXI.Sprite.from(UI_ASSETS.play);
      const btnW = Math.min(GAME_WIDTH - 120, 320);
      const baseScale = btnW / playSprite.width;
      playSprite.anchor.set(0.5);
      playSprite.scale.set(baseScale);
      playSprite.x = GAME_WIDTH / 2;
      playSprite.y = GAME_HEIGHT * 0.72;
      playSprite.eventMode = 'static';
      playSprite.cursor = 'pointer';
      playSprite.on('pointerdown', () => {
        playSprite.scale.set(baseScale * 0.92);
        setTimeout(() => playSprite.scale.set(baseScale), 120);
        if (this.callbacks.onPlay) this.callbacks.onPlay();
      });
      this.container.addChild(playSprite);

      const playTxt = new PIXI.Text('PLAY', {
        fontFamily: FONT, fontSize: 26, fill: 0xFFFFFF, fontWeight: 'bold',
        stroke: 0x000000, strokeThickness: 3,
      });
      playTxt.anchor.set(0.5);
      playTxt.x = GAME_WIDTH / 2;
      playTxt.y = playSprite.y;
      this.container.addChild(playTxt);
    } catch {
      const btn = new PIXI.Graphics();
      const btnW = 280;
      btn.beginFill(0xFF3B30);
      btn.drawRoundedRect(0, 0, btnW, 60, 30);
      btn.endFill();
      btn.beginFill(0xFFFFFF, 0.08);
      btn.drawRoundedRect(8, 5, btnW - 16, 18, 10);
      btn.endFill();
      btn.x = (GAME_WIDTH - btnW) / 2;
      btn.y = GAME_HEIGHT * 0.72 - 30;
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => {
        btn.scale.set(0.92);
        setTimeout(() => btn.scale.set(1), 120);
        if (this.callbacks.onPlay) this.callbacks.onPlay();
      });
      this.container.addChild(btn);

      const playTxt = new PIXI.Text('PLAY', {
        fontFamily: FONT, fontSize: 28, fill: 0xFFFFFF, fontWeight: 'bold',
      });
      playTxt.anchor.set(0.5);
      playTxt.x = (GAME_WIDTH - btnW) / 2 + btnW / 2;
      playTxt.y = GAME_HEIGHT * 0.72;
      this.container.addChild(playTxt);
    }
  }

  _buildSettingsPopup() {
    this._settingsContainer = new PIXI.Container();
    this._settingsContainer.visible = false;
    this.container.addChild(this._settingsContainer);

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.65);
    overlay.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.endFill();
    overlay.eventMode = 'static';
    this._settingsContainer.addChild(overlay);

    const popW = 300;
    const popH = 180;
    const popX = (GAME_WIDTH - popW) / 2;
    const popY = (GAME_HEIGHT - popH) / 2;

    const glass = new PIXI.Graphics();
    glass.beginFill(0x1E1040, 0.85);
    glass.lineStyle(1.5, 0x6A4C93, 0.5);
    glass.drawRoundedRect(0, 0, popW, popH, 20);
    glass.endFill();
    glass.beginFill(0xFFFFFF, 0.04);
    glass.drawRoundedRect(8, 6, popW - 16, 40, 12);
    glass.endFill();
    glass.x = popX;
    glass.y = popY;
    this._settingsContainer.addChild(glass);

    const settingsTitle = new PIXI.Text('Settings', {
      fontFamily: FONT, fontSize: 18, fill: 0xFFFFFF, fontWeight: 'bold',
    });
    settingsTitle.anchor.set(0.5);
    settingsTitle.x = popX + popW / 2;
    settingsTitle.y = popY + 28;
    this._settingsContainer.addChild(settingsTitle);

    const iconY = popY + 95;

    const addPopupIcon = (assetKey, xPos, label, getOn, setOn) => {
      try {
        const sprite = PIXI.Sprite.from(assetKey);
        sprite.anchor.set(0.5);
        const sz = Math.max(sprite.texture.orig.width, sprite.texture.orig.height);
        sprite.scale.set(44 / sz);
        sprite.x = xPos;
        sprite.y = iconY;
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', () => {
          setOn(!getOn());
          sprite.alpha = getOn() ? 1 : 0.35;
        });
        this._settingsContainer.addChild(sprite);
      } catch {}

      const lbl = new PIXI.Text(label, {
        fontFamily: FONT, fontSize: 11, fill: 0xAAAAAA,
      });
      lbl.anchor.set(0.5);
      lbl.x = xPos;
      lbl.y = iconY + 30;
      this._settingsContainer.addChild(lbl);
    };

    addPopupIcon(UI_ASSETS.speaker, popX + popW / 2 - 50, 'Sound',
      () => this._soundOn, (v) => { this._soundOn = v; });
    addPopupIcon(UI_ASSETS.music, popX + popW / 2 + 50, 'Music',
      () => this._musicOn, (v) => { this._musicOn = v; });

    try {
      const closeBtn = PIXI.Sprite.from(UI_ASSETS.close);
      closeBtn.width = 34;
      closeBtn.height = 34;
      closeBtn.x = popX + popW - 17;
      closeBtn.y = popY - 5;
      closeBtn.anchor.set(0.5);
      closeBtn.eventMode = 'static';
      closeBtn.cursor = 'pointer';
      closeBtn.on('pointerdown', () => this._hideSettings());
      this._settingsContainer.addChild(closeBtn);

      const xMark = new PIXI.Text('✕', {
        fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
      });
      xMark.anchor.set(0.5);
      xMark.x = 0;
      xMark.y = 0;
      closeBtn.addChild(xMark);
    } catch {
      const fb = new PIXI.Graphics();
      fb.beginFill(0xff4444);
      fb.drawCircle(popX + popW - 17, popY - 5, 17);
      fb.endFill();
      fb.eventMode = 'static';
      fb.cursor = 'pointer';
      fb.on('pointerdown', () => this._hideSettings());
      this._settingsContainer.addChild(fb);

      const xMark = new PIXI.Text('✕', {
        fontFamily: FONT, fontSize: 16, fill: 0xFFFFFF, fontWeight: 'bold',
      });
      xMark.anchor.set(0.5);
      xMark.x = popX + popW - 17;
      xMark.y = popY - 5;
      this._settingsContainer.addChild(xMark);
    }
  }

  _showSettings() {
    this._settingsContainer.visible = true;
  }

  _hideSettings() {
    this._settingsContainer.visible = false;
  }

  addCoins(amount) {
    this._coinTarget += amount;
    localStorage.setItem('blockblast_coins', String(this._coinTarget));
  }

  updateHighScore(score) {
    this._hsValue.text = `${score}`;
  }

  setLevel(level) {
    if (this._levelText) this._levelText.text = `LV.${level}`;
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
    this._settingsContainer.visible = false;
  }

  update(delta) {
    if (!this.visible || !this._loaded) return;
    this._logoTime += delta * 0.03;
    this._logo.y = this._logoBaseY + Math.sin(this._logoTime) * 4;

    if (this._coinDisplay !== this._coinTarget) {
      const diff = this._coinTarget - this._coinDisplay;
      const step = Math.max(1, Math.ceil(Math.abs(diff) * 0.12 * delta));
      if (Math.abs(diff) < step) {
        this._coinDisplay = this._coinTarget;
      } else {
        this._coinDisplay += Math.sign(diff) * step;
      }
      this._coinText.text = `${Math.floor(this._coinDisplay)}`;
    }
  }

  destroy() {}
}
