import { IO_MAP } from "../../utils/const/memory-map.const";

export class Joypad {
  private registers = new Uint8Array(1); // 0xFF00

  readByte(address: number): number {
    return this.registers[address - IO_MAP.JOYPAD.START];
  }

  writeByte(address: number, value: number): void {
    this.registers[address - IO_MAP.JOYPAD.START] = value;
  }
}
