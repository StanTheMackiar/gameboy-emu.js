import { IO_MAP, MEMORY_MAP } from "../utils/const/memory-map.const";
import type { Cartridge } from "./cartridge";
import type { APU } from "./io/apu";
import type { BootROMControl } from "./io/boot-rom";
import type { Interrupts } from "./io/interrupts";
import type { Joypad } from "./io/joypad";
import type { Timer } from "./io/timer";
import type { PPU } from "./ppu";
import type { RAM } from "./ram";

export class MMU {
  constructor(
    public rom: Cartridge,
    public ppu: PPU,
    public apu: APU,
    public ram: RAM,
    public timer: Timer,
    public interrupts: Interrupts,
    public joypad: Joypad,
    private bootRom: BootROMControl
  ) {
    this.loadIORegisters();
  }

  readByte(addr: number): number {
    addr &= 0xffff; // 16 bits mask

    if (addr <= MEMORY_MAP.ROM_0.END) {
      return this.rom.getRomByte(addr);
    }

    if (addr <= MEMORY_MAP.ROM_N.END) {
      return this.rom.getRomByte(addr);
    }

    if (addr <= MEMORY_MAP.VRAM.END) {
      return this.ppu.getVRAMByte(addr);
    }

    if (addr <= MEMORY_MAP.EXTERNAL_RAM.END) {
      return this.rom.getExternalRamByte(addr);
    }

    if (addr <= MEMORY_MAP.WRAM.END) {
      return this.ram.getByte(addr);
    }

    if (addr <= MEMORY_MAP.ECHO_RAM.END) {
      return this.ram.getByte(addr);
    } // echo RAM

    if (addr <= MEMORY_MAP.OAM.END) {
      return this.ppu.getOAMByte(addr);
    }

    if (addr <= MEMORY_MAP.NOT_USABLE.END) return 0xff;

    // --- IO registers ---
    if (addr <= MEMORY_MAP.IO.END) {
      if (addr <= IO_MAP.JOYPAD.END) {
        return this.joypad.getByte();
      }

      if (addr <= IO_MAP.SERIAL.END) {
        console.warn("Serial transfer not implemented");
        return 0xff;
      }

      if (addr <= IO_MAP.TIMER.END) {
        return this.timer.readByte(addr);
      }

      if (addr <= IO_MAP.IF.END) {
        return this.interrupts.getInterruptFlags();
      }

      if (addr <= IO_MAP.APU_AUDIO.END) {
        return this.apu.readRegister(addr);
      }

      if (addr <= IO_MAP.APU_WAVE.END) {
        return this.apu.readWaveRAM(addr);
      }

      if (addr <= IO_MAP.PPU.END) {
        return this.ppu.getIOByte(addr);
      }

      if (addr <= IO_MAP.VRAM_BANK_SELECT.END) {
        console.warn("VRAM Bank Select not implemented");
        return 0xff;
      }

      if (addr <= IO_MAP.BOOT_ROM.END) {
        return this.bootRom.getIORegister();
      }

      if (addr <= IO_MAP.WRAM_BANK_SELECT.END) {
        console.warn("GBC not implemented");
        return 0xff;
      }
    }

    if (addr <= MEMORY_MAP.HRAM.END) {
      return this.ram.getByte(addr);
    }

    if (addr === MEMORY_MAP.IE.START) {
      return this.interrupts.getInterruptEnable();
    }

    return 0xff;
  }

  writeByte(addr: number, value: number) {
    addr &= 0xffff; //16 bits mask
    value &= 0xff; // 8 bits mask

    if (addr <= MEMORY_MAP.ROM_N.END) {
      console.warn("Attempt to write to ROM at address", addr.toString(16));

      return;
    } // ROM

    if (addr <= MEMORY_MAP.VRAM.END) {
      return this.ppu.setVRAMByte(addr, value);
    }

    if (addr <= MEMORY_MAP.EXTERNAL_RAM.END) {
      return this.rom.setExternalRamByte(addr, value);
    }

    if (addr <= MEMORY_MAP.WRAM.END) {
      return this.ram.setByte(addr, value);
    }

    if (addr <= MEMORY_MAP.ECHO_RAM.END) {
      return this.ram.setByte(addr - MEMORY_MAP.ECHO_RAM.START, value);
    } // echo RAM

    if (addr <= MEMORY_MAP.OAM.END) {
      return this.ppu.setOAMByte(addr, value);
    }

    if (addr <= MEMORY_MAP.NOT_USABLE.END) {
      console.warn(
        "Attempt to write to non-usable memory at address",
        addr.toString(16)
      );
      return;
    }

    // --- IO registers ---
    if (addr <= MEMORY_MAP.IO.END) {
      if (addr <= IO_MAP.JOYPAD.END) {
        return this.joypad.setByte(value);
      }

      if (addr <= IO_MAP.SERIAL.END) {
        console.warn("Serial transfer not implemented");
        return;
      }

      if (addr <= IO_MAP.TIMER.END) {
        return this.timer.writeByte(addr, value);
      }

      if (addr <= IO_MAP.IF.END) {
        return this.interrupts.setInterruptFlags(value);
      }

      if (addr <= IO_MAP.APU_AUDIO.END) {
        return this.apu.writeRegister(addr, value);
      }

      if (addr <= IO_MAP.APU_WAVE.END) {
        return this.apu.writeWaveRAM(addr, value);
      }

      if (addr <= IO_MAP.PPU.END) {
        return this.ppu.writeIOByte(addr, value);
      }

      if (addr <= IO_MAP.VRAM_BANK_SELECT.END) {
        console.warn("VRAM Bank Select not implemented");
        return;
      }

      if (addr <= IO_MAP.BOOT_ROM.END) {
        return this.bootRom.setIORegister(value);
      }

      if (addr <= IO_MAP.WRAM_BANK_SELECT.END) {
        console.warn("GBC not implemented");
        return;
      }
    }

    if (addr <= MEMORY_MAP.HRAM.END) {
      return this.ram.setByte(addr, value);
    }

    if (addr === MEMORY_MAP.IE.START) {
      return this.interrupts.setInterruptEnable(value);
    }

    return 0xff;
  }

  readInstruction(addr: number): number {
    const low = this.readByte(addr);
    const high = this.readByte(addr + 1);
    return (high << 8) | low;
  }

  public reset() {
    this.ram.reset();
    this.ppu.clear();

    this.loadIORegisters();
  }

  loadIORegisters() {
    // Valores iniciales de IO registers
    this.writeByte(0xff10, 0x80); // NR10
    this.writeByte(0xff11, 0xbf);
    this.writeByte(0xff12, 0xf3);
    this.writeByte(0xff14, 0xbf);
    this.writeByte(0xff16, 0x3f);
    this.writeByte(0xff19, 0xbf);
    this.writeByte(0xff1a, 0x7f);
    this.writeByte(0xff1c, 0x9f);
    this.writeByte(0xff1e, 0xbf);
    this.writeByte(0xff20, 0xff);
    this.writeByte(0xff23, 0xbf);
    this.writeByte(0xff24, 0x77);
    this.writeByte(0xff25, 0xf3);
    this.writeByte(0xff26, 0xf1);
    this.writeByte(0xff40, 0x91);
    this.writeByte(0xff47, 0xfc);
    this.writeByte(0xff48, 0xff);
    this.writeByte(0xff49, 0xff);
    this.writeByte(0xffff, 0x00); // IE
  }
}
