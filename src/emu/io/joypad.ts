export class Joypad {
  JOYPAD_INIT = 0xcf; //0b1100 1111
  private joypad!: number;

  constructor() {
    this.reset();
  }

  reset() {
    this.joypad = this.JOYPAD_INIT;
  }

  getByte(): number {
    return this.joypad;
  }

  setByte(value: number): void {
    this.joypad = value;
  }

  pressButton(button: number): void {
    this.joypad |= button;
  }

  releaseButton(button: number): void {
    this.joypad &= ~button;
  }
}
