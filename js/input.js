export class InputHandler {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.isDown = false;

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);

    canvas.addEventListener('mousedown', this.onDown);
    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseup', this.onUp);
    canvas.addEventListener('touchstart', this.onDown, { passive: false });
    window.addEventListener('touchmove', this.onMove, { passive: false });
    window.addEventListener('touchend', this.onUp);
    canvas.addEventListener('touchcancel', this.onUp, { passive: false });
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  onDown(e) {
    e.preventDefault();
    this.isDown = true;
    if (this.callbacks.aim) this.callbacks.aim(this.getPos(e));
  }

  onMove(e) {
    e.preventDefault();
    if (this.isDown && this.callbacks.aim) {
      this.callbacks.aim(this.getPos(e));
    }
  }

  onUp(e) {
    e.preventDefault();
    if (this.isDown && this.callbacks.shoot) {
      this.callbacks.shoot();
    }
    this.isDown = false;
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mousemove', this.onMove);
    window.removeEventListener('mouseup', this.onUp);
    this.canvas.removeEventListener('touchstart', this.onDown);
    window.removeEventListener('touchmove', this.onMove);
    window.removeEventListener('touchend', this.onUp);
    this.canvas.removeEventListener('touchcancel', this.onUp);
  }
}
