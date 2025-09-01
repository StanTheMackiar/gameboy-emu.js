import { APU_MASK } from "../../utils/const/apu.const";

export class APU {
  private registers = new Uint8Array(0x17); // 0xFF10–0xFF26 (23 bytes)
  private waveRAM = new Uint8Array(0x10); // 0xFF30–0xFF3F (16 bytes)

  ADDRESSES = {
    REGISTER_START: 0xff10,
    REGISTER_END: 0xff26,
    WAVE_RAM_START: 0xff30,
    WAVE_RAM_END: 0xff3f,
  };

  constructor() {
    this.loadAPUMask();
  }

  validateRegister(address: number): boolean {
    return (
      (address >= this.ADDRESSES.REGISTER_START &&
        address <= this.ADDRESSES.REGISTER_END) ||
      (address >= this.ADDRESSES.WAVE_RAM_START &&
        address <= this.ADDRESSES.WAVE_RAM_END)
    );
  }

  readRegister(address: number): number {
    if (
      address >= this.ADDRESSES.REGISTER_START &&
      address <= this.ADDRESSES.REGISTER_END
    ) {
      return this.registers[address - this.ADDRESSES.REGISTER_START];
    }
    if (
      address >= this.ADDRESSES.WAVE_RAM_START &&
      address <= this.ADDRESSES.WAVE_RAM_END
    ) {
      return this.waveRAM[address - this.ADDRESSES.WAVE_RAM_START];
    }
    throw new Error(`APU read fuera de rango: ${address.toString(16)}`);
  }

  writeRegister(address: number, value: number): void {
    if (
      address >= this.ADDRESSES.REGISTER_START &&
      address <= this.ADDRESSES.REGISTER_END
    ) {
      const offset = address - this.ADDRESSES.REGISTER_START;
      this.registers[offset] = value & APU_MASK[offset];
      return;
    }
    if (
      address >= this.ADDRESSES.WAVE_RAM_START &&
      address <= this.ADDRESSES.WAVE_RAM_END
    ) {
      this.waveRAM[address - this.ADDRESSES.WAVE_RAM_START] = value & 0xff;
      return;
    }
    throw new Error(`APU write fuera de rango: ${address.toString(16)}`);
  }

  private loadAPUMask() {
    this.registers.set(APU_MASK.slice(0, this.registers.length));
  }

  reset(): void {
    this.loadAPUMask();
    this.waveRAM.fill(0);
  }
}
