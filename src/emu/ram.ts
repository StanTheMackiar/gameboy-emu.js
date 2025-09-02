import { MEMORY_MAP } from "../utils/const/memory-map.const";

export class RAM {
  constructor(
    private WRAM = new Uint8Array(0x2000), // 8KB
    private HRAM = new Uint8Array(0x7f) // 127B
  ) {}

  public getByte(addr: number): number {
    if (addr >= MEMORY_MAP.WRAM.START && addr <= MEMORY_MAP.WRAM.END)
      return this.WRAM[addr - MEMORY_MAP.WRAM.START];

    if (addr >= MEMORY_MAP.ECHO_RAM.START && addr <= MEMORY_MAP.ECHO_RAM.END)
      return this.WRAM[addr - MEMORY_MAP.ECHO_RAM.START];

    if (addr >= MEMORY_MAP.HRAM.START && addr <= MEMORY_MAP.HRAM.END)
      return this.HRAM[addr - MEMORY_MAP.HRAM.START];

    return 0xff;
  }

  public setByte(addr: number, value: number): void {
    if (addr >= MEMORY_MAP.WRAM.START && addr <= MEMORY_MAP.WRAM.END) {
      this.WRAM[addr - MEMORY_MAP.WRAM.START] = value;
      return;
    }

    if (addr >= MEMORY_MAP.ECHO_RAM.START && addr <= MEMORY_MAP.ECHO_RAM.END) {
      this.WRAM[addr - MEMORY_MAP.ECHO_RAM.START] = value;
      return;
    }

    if (addr >= MEMORY_MAP.HRAM.START && addr <= MEMORY_MAP.HRAM.END) {
      this.HRAM[addr - MEMORY_MAP.HRAM.START] = value;
      return;
    }
  }
}
