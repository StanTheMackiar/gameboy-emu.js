import { MEMORY_MAP } from "../utils/const/memory-map.const";

export class Cartridge {
  private ROM_0 = new Uint8Array(0x4000); // 0x0000–0x3FFF
  private ROM_N = new Uint8Array(0x4000); // 0x4000–0x7FFF
  private EXTERNAL_RAM = new Uint8Array(0x2000); // 0xA000–0xBFFF

  constructor() {}

  public loadRom(romData: Uint8Array) {
    this.ROM_0.set(romData.slice(0, 0x4000));
  }

  getRomByte(address: number): number {
    if (address >= MEMORY_MAP.ROM_0.START && address <= MEMORY_MAP.ROM_0.END)
      return this.ROM_0[address];

    if (address >= MEMORY_MAP.ROM_N.START && address <= MEMORY_MAP.ROM_N.END)
      return this.ROM_N[address - MEMORY_MAP.ROM_N.START];

    return 0xff;
  }

  getExternalRamByte(address: number): number {
    if (
      address >= MEMORY_MAP.EXTERNAL_RAM.START &&
      address <= MEMORY_MAP.EXTERNAL_RAM.END
    )
      return this.EXTERNAL_RAM[address - MEMORY_MAP.EXTERNAL_RAM.START];

    return 0xff;
  }

  setRom0Byte(address: number, value: number): void {
    if (address >= MEMORY_MAP.ROM_0.START && address <= MEMORY_MAP.ROM_0.END) {
      this.ROM_0[address - MEMORY_MAP.ROM_0.START] = value;
    }
  }

  setExternalRamByte(address: number, value: number): void {
    if (
      address >= MEMORY_MAP.EXTERNAL_RAM.START &&
      address <= MEMORY_MAP.EXTERNAL_RAM.END
    ) {
      this.EXTERNAL_RAM[address - MEMORY_MAP.EXTERNAL_RAM.START] = value;
    }
  }
}
