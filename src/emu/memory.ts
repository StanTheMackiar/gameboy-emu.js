export class Memory {
  // --- Sizes ---
  private ROM_BANK_0 = new Uint8Array(0x4000); // 0x0000–0x3FFF
  private ROM_BANK_N = new Uint8Array(0x4000); // 0x4000–0x7FFF
  private VRAM = new Uint8Array(0x2000); // 0x8000–0x9FFF
  private EXTERNAL_RAM = new Uint8Array(0x2000); // 0xA000–0xBFFF
  private WRAM = new Uint8Array(0x2000); // 0xC000–0xDFFF
  //   private ECHO_RAM = new Uint8Array(0x1e00); // 0xE000–0xFDFF (mirror de WRAM)
  private OAM = new Uint8Array(0xa0); // 0xFE00–0xFE9F
  private IO = new Uint8Array(0x80); // 0xFF00–0xFF7F
  private HRAM = new Uint8Array(0x7f); // 0xFF80–0xFFFE
  private interruptEnable = 0x00; // 0xFFFF

  constructor() {
    // Cargar ROM en los primeros 32KB (bank 0 + bank N)
  }

  loadRom(romData: Uint8Array) {
    this.ROM_BANK_0.set(romData.slice(0, 0x4000));
    this.ROM_BANK_N.set(romData.slice(0x4000, 0x8000));
  }

  readByte(addr: number): number {
    addr &= 0xffff;
    if (addr < 0x4000) return this.ROM_BANK_0[addr];
    if (addr < 0x8000) return this.ROM_BANK_N[addr - 0x4000];
    if (addr < 0xa000) return this.VRAM[addr - 0x8000];
    if (addr < 0xc000) return this.EXTERNAL_RAM[addr - 0xa000];
    if (addr < 0xe000) return this.WRAM[addr - 0xc000];
    if (addr < 0xfe00) return this.WRAM[addr - 0xe000]; // echo RAM
    if (addr < 0xfea0) return this.OAM[addr - 0xfe00];
    if (addr < 0xff00) return 0xff;

    // --- IO registers ---
    if (addr === 0xff0f) return this.IO[0x0f]; // IF
    if (addr < 0xff80) return this.IO[addr - 0xff00];

    if (addr < 0xffff) return this.HRAM[addr - 0xff80];

    return this.interruptEnable; // IE
  }

  writeByte(addr: number, value: number) {
    addr &= 0xffff;
    value &= 0xff;

    if (addr < 0x8000) return; // ROM
    if (addr < 0xa000) {
      this.VRAM[addr - 0x8000] = value;
      return;
    }
    if (addr < 0xc000) {
      this.EXTERNAL_RAM[addr - 0xa000] = value;
      return;
    }
    if (addr < 0xe000) {
      this.WRAM[addr - 0xc000] = value;
      return;
    }
    if (addr < 0xfe00) {
      this.WRAM[addr - 0xe000] = value;
      return;
    }
    if (addr < 0xfea0) {
      this.OAM[addr - 0xfe00] = value;
      return;
    }
    if (addr < 0xff00) return;

    // --- IO registers ---
    if (addr === 0xff0f) {
      this.IO[0x0f] = value;
      return;
    } // IF
    if (addr < 0xff80) {
      this.IO[addr - 0xff00] = value;
      return;
    }

    if (addr < 0xffff) {
      this.HRAM[addr - 0xff80] = value;
      return;
    }

    this.interruptEnable = value; // IE
  }

  readInstruction(addr: number): number {
    const low = this.readByte(addr);
    const high = this.readByte(addr + 1);
    return (high << 8) | low;
  }

  reset() {
    this.VRAM.fill(0);
    this.EXTERNAL_RAM.fill(0);
    this.WRAM.fill(0);
    this.OAM.fill(0);
    this.IO.fill(0);
    this.HRAM.fill(0);
    this.interruptEnable = 0;
  }
}

const apuMask = [
  0x80,
  0x3f,
  0x00,
  0xff,
  0xbf, // NR10-NR15
  0xff,
  0x3f,
  0x00,
  0xff,
  0xbf, // NR20-NR25
  0x7f,
  0xff,
  0x9f,
  0xff,
  0xbf, // NR30-NR35
  0xff,
  0xff,
  0x00,
  0x00,
  0xbf, // NR40-NR45
  0x00,
  0x00,
  0x70, // NR50-NR52
  0xff,
  0xff,
  0xff,
  0xff,
  0xff,
  0xff,
  0xff,
  0xff,
  0xff,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // Wave RAM
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
];
