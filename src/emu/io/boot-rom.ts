export class BootROMControl {
  private IORegister: number;

  constructor() {
    this.IORegister = 0x01;
  }

  setIORegister(value: number) {
    this.IORegister = value;
  }

  getIORegister(): number {
    return this.IORegister;
  }
}
