import { InterruptTypeEnum } from "../../utils/enum/interrupt-type.enum";

export class Interrupts {
  private IE: number = 0; // Interrupt Enable Register (0xFFFF)
  private IF: number = 0; // Interrupt Flag Register (0xFF0F)
  public IME: boolean = false; // Interrupt Master Enable Flag

  constructor() {}

  public reset() {
    this.IE = 0;
    this.IF = 0;
    this.IME = false;
  }

  public getInterruptFlags() {
    return this.IF;
  }

  public setInterruptFlags(value: number) {
    this.IF = value;
  }

  public getInterruptEnable() {
    return this.IE;
  }

  public setInterruptEnable(value: number) {
    this.IE = value;
  }

  public requestInterrupt(type: InterruptTypeEnum) {
    if (!this.IME) return;

    // Establece el bit correspondiente para solicitar la interrupción
    this.IF |= type;
  }

  getPendingInterrupt(): InterruptTypeEnum | null {
    if (!this.IME) return null;

    const pending = this.IE & this.IF;
    if (pending === 0) return null;

    if (pending & InterruptTypeEnum.VBLANK) return InterruptTypeEnum.VBLANK;
    if (pending & InterruptTypeEnum.LCD_STAT) return InterruptTypeEnum.LCD_STAT;
    if (pending & InterruptTypeEnum.TIMER) return InterruptTypeEnum.TIMER;
    if (pending & InterruptTypeEnum.SERIAL) return InterruptTypeEnum.SERIAL;
    if (pending & InterruptTypeEnum.JOYPAD) return InterruptTypeEnum.JOYPAD;

    return null;
  }

  clearInterrupt(type: InterruptTypeEnum): void {
    if (!this.IME) return;
    // Niega el bit correspondiente para limpiar la interrupción
    this.IF &= ~type;
  }
}
