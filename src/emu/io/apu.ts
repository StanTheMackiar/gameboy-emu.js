import { APU_MASK } from "../../utils/const/apu.const";
import { IO_MAP } from "../../utils/const/memory-map.const";

export class APU {
  private registers = new Uint8Array(0x17); // 0xFF10–0xFF26 (23 bytes)
  private waveRAM = new Uint8Array(0x10); // 0xFF30–0xFF3F (16 bytes)

  constructor() {
    this.loadAPUMask();
  }

  readRegister(address: number): number {
    if (address >= IO_MAP.APU_AUDIO.START && address <= IO_MAP.APU_AUDIO.END) {
      return this.registers[address - IO_MAP.APU_AUDIO.START];
    }

    return 0xff; // fallback seguro
  }

  readWaveRAM(address: number): number {
    if (address >= IO_MAP.APU_WAVE.START && address <= IO_MAP.APU_WAVE.END) {
      return this.waveRAM[address - IO_MAP.APU_WAVE.START];
    }

    return 0xff; // fallback seguro
  }

  writeRegister(address: number, value: number): void {
    if (address >= IO_MAP.APU_AUDIO.START && address <= IO_MAP.APU_AUDIO.END) {
      const offset = address - IO_MAP.APU_AUDIO.START;
      this.registers[offset] = value & APU_MASK[offset];
    }
  }

  writeWaveRAM(address: number, value: number): void {
    if (address >= IO_MAP.APU_WAVE.START && address <= IO_MAP.APU_WAVE.END) {
      this.waveRAM[address - IO_MAP.APU_WAVE.START] = value & 0xff;
    }
  }

  private loadAPUMask() {
    this.registers.set(APU_MASK.slice(0, this.registers.length));
  }

  reset(): void {
    this.loadAPUMask();
    this.waveRAM.fill(0);
  }
}
