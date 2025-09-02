import { IO_MAP } from "../../utils/const/memory-map.const";

export class Serial {
  private registers = new Uint8Array(2); // 0xFF01–0xFF02

  readRegister(address: number): number {
    return this.registers[address - IO_MAP.SERIAL.START];
  }

  writeRegister(address: number, value: number): void {
    this.registers[address - IO_MAP.SERIAL.START] = value;
  }
}
