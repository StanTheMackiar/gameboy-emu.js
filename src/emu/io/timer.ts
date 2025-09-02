import { IO_MAP } from "../../utils/const/memory-map.const";

export class Timer {
  private registers = new Uint8Array(8); // 0xFF04–0xFF07

  readRegister(address: number): number {
    return this.registers[address - IO_MAP.TIMER.START];
  }

  writeRegister(address: number, value: number): void {
    this.registers[address - IO_MAP.TIMER.START] = value;
  }
}
