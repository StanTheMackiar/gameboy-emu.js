import { APU_MASK } from "../utils/const/apu.const";
import type { Cartridge } from "./cartridge";
import type { PPU } from "./ppu";

type IOHandler = {
  read: () => number;
  write: (v: number) => void;
};

export class MMU {
  // --- Sizes --
  private interruptEnable = 0x00; // 0xFFFF
  private interruptFlags = 0;

  constructor(
    private rom: Cartridge,
    private ppu: PPU,
    private apu: APU,
    private timer: Timer,
    private serial: Serial,
    private joypad: Joypad,
    private wram = new Uint8Array(0x2000), // 8KB
    private hram = new Uint8Array(0x7f) // 127B
  ) {
    this.loadAPUMask();
  }

  public registerIO(addr: number, handler: IOHandler) {
    this.ioHandlers.set(addr & 0xff, handler);
  }

  public readIO(addr: number): number {
    const off = addr - 0xff00;
    const handler = this.ioHandlers.get(off);
    if (handler) return handler.read();
    return this.IO[off];
  }

  public writeIO(addr: number, value: number) {
    const off = addr - 0xff00;
    const handler = this.ioHandlers.get(off);
    if (handler) {
      handler.write(value);
    } else {
      this.IO[off] = value;
    }
  }

  loadRom(romData: Uint8Array) {
    this.ROM_BANK_0.set(romData.slice(0, 0x4000));
    this.ROM_BANK_N.set(romData.slice(0x4000, 0x8000));
  }

  readByte(addr: number): number {
    addr &= 0xffff; // 16 bits mask

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
    addr &= 0xffff; //16 bits mask
    value &= 0xff; // 8 bits mask

    if (addr < 0x8000) {
      console.warn("Attempt to write to ROM at address", addr.toString(16));

      return;
    } // ROM
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

  public reset() {
    this.VRAM.fill(0);
    this.EXTERNAL_RAM.fill(0);
    this.WRAM.fill(0);
    this.OAM.fill(0);
    this.IO.fill(0);
    this.HRAM.fill(0);
    this.interruptEnable = 0;

    this.IO.fill(0);
    this.loadAPUMask();
  }

  private loadAPUMask() {
    const apuMask = APU_MASK;

    for (let i = 0; i < apuMask.length; i++) {
      this.IO[0x10 + i] = apuMask[i]; // 0xFF10–0xFF3F
    }
  }
}
