import { APU_MASK } from "../../utils/const/apu.const";

export class APU {
  private registers = new Uint8Array(0x17); // 0xFF10–0xFF26 (23 bytes)
  private waveRAM = new Uint8Array(0x10); // 0xFF30–0xFF3F (16 bytes)

  ADDRESSES = {
    REGISTER: {
      START: 0xff10,
      END: 0xff26,
    },
    UNUSED: {
      START: 0xff27,
      END: 0xff2f,
    },
    WAVE_RAM: {
      START: 0xff30,
      END: 0xff3f,
    },
  };

  constructor() {
    this.loadAPUMask();
  }

  readRegister(address: number): number {
    if (
      address >= this.ADDRESSES.REGISTER.START &&
      address <= this.ADDRESSES.REGISTER.END
    ) {
      return this.registers[address - this.ADDRESSES.REGISTER.START];
    }

    if (
      address >= this.ADDRESSES.UNUSED.START &&
      address <= this.ADDRESSES.UNUSED.END
    ) {
      return 0xff; // registros no implementados → devuelven 0xFF
    }

    return 0xff; // fallback seguro
  }

  readWaveRAM(address: number): number {
    if (
      address >= this.ADDRESSES.WAVE_RAM.START &&
      address <= this.ADDRESSES.WAVE_RAM.END
    ) {
      return this.waveRAM[address - this.ADDRESSES.WAVE_RAM.START];
    }

    return 0xff; // fallback seguro
  }

  writeRegister(address: number, value: number): void {
    if (
      address >= this.ADDRESSES.REGISTER.START &&
      address <= this.ADDRESSES.REGISTER.END
    ) {
      const offset = address - this.ADDRESSES.REGISTER.START;
      this.registers[offset] = value & APU_MASK[offset];
      return;
    }

    if (
      address >= this.ADDRESSES.UNUSED.START &&
      address <= this.ADDRESSES.UNUSED.END
    ) {
      return; // se ignora la escritura
    }

    if (
      address >= this.ADDRESSES.WAVE_RAM.START &&
      address <= this.ADDRESSES.WAVE_RAM.END
    ) {
      this.waveRAM[address - this.ADDRESSES.WAVE_RAM.START] = value & 0xff;
      return;
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
