import { MEMORY_MAP } from "../utils/const/memory-map.const";
import type { Cartridge } from "./cartridge";
import type { APU } from "./io/apu";
import type { Joypad } from "./io/joypad";
import type { Serial } from "./io/serial";
import type { Timer } from "./io/timer";
import type { PPU } from "./ppu";
import type { RAM } from "./ram";

export class MMU {
  constructor(
    private rom: Cartridge,
    private ppu: PPU,
    private apu: APU,
    private ram: RAM,
    private timer: Timer,
    private serial: Serial,
    private joypad: Joypad
  ) {}

  readByte(addr: number): number {
    addr &= 0xffff; // 16 bits mask

    if (addr <= MEMORY_MAP.ROM_0.END) {
      return this.rom.getRomByte(addr);
    }

    if (addr <= MEMORY_MAP.ROM_N.END) {
      return this.rom.getRomByte(addr - MEMORY_MAP.ROM_N.START);
    }

    if (addr <= MEMORY_MAP.VRAM.END) {
      return this.ppu.getVRAMByte(addr - MEMORY_MAP.VRAM.START);
    }

    if (addr <= MEMORY_MAP.EXTERNAL_RAM.END) {
      return this.rom.getExternalRamByte(addr - MEMORY_MAP.EXTERNAL_RAM.START);
    }

    if (addr <= MEMORY_MAP.WRAM.END) {
      return this.ram.getByte(addr - MEMORY_MAP.WRAM.START);
    }

    if (addr <= MEMORY_MAP.ECHO_RAM.END) {
      return this.ram.getByte(addr - MEMORY_MAP.ECHO_RAM.START);
    } // echo RAM

    if (addr <= MEMORY_MAP.OAM.END) {
      return this.ppu.getOAMByte(addr - MEMORY_MAP.OAM.START);
    }

    if (addr <= MEMORY_MAP.NOT_USABLE.START) return 0xff;

    // --- IO registers ---
    //TODO

    return 0xff;
  }

  writeByte(addr: number, value: number) {
    addr &= 0xffff; //16 bits mask
    value &= 0xff; // 8 bits mask

    if (addr < 0x8000) {
      console.warn("Attempt to write to ROM at address", addr.toString(16));

      return;
    } // ROM
    //TODO
  }

  readInstruction(addr: number): number {
    const low = this.readByte(addr);
    const high = this.readByte(addr + 1);
    return (high << 8) | low;
  }

  public reset() {
    //TODO
  }
}
