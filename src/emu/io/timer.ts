export class Timer {
  private OFFSET = 0xff04;
  private registers = new Uint8Array(0x03); // 0xFF04–0xFF07

  readRegister(address: number): number {
    return this.registers[address - this.OFFSET];
  }

  writeRegister(address: number, value: number): void {
    this.registers[address - this.OFFSET] = value;
  }
}
