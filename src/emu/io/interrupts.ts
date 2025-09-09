import { InterruptTypeEnum } from "../../utils/enum/interrupt-type.enum";

export class Interrupts {
  private IE: number; // Interrupt Enable Register (0xFFFF)
  private IF: number; // Interrupt Flag Register (0xFF0F)

  constructor(private IME: boolean = false) {
    this.IE = 0;
    this.IF = 0;
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
    if (pending & InterruptTypeEnum.LCD) return InterruptTypeEnum.LCD;
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
