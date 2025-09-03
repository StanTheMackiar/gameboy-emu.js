export class Interrupts {
  private IE: number; // Interrupt Enable Register
  private IF: number; // Interrupt Flag Register
  private IME: boolean; // Interrupt Master Enable

  constructor() {
    this.IE = 0;
    this.IF = 0xe1;
    this.IME = false;
  }

  public setIME(value: boolean) {
    this.IME = value;
  }

  public getIME() {
    return this.IME;
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
}
