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
    public cartridge: Cartridge,
    public ppu: PPU,
    public apu: APU,
    public ram: RAM,
    public timer: Timer,
    public interrupts: Interrupts,
    public joypad: Joypad,
    private bootRom: BootROMControl
  ) {}

  readByte(addr: number): number {
    addr &= 0xffff; // 16 bits mask

    // Si la Boot ROM está activa, se lee de ahí en 0x0000-0x00FF
    if (this.bootRom.isEnabled() && addr < 0x100) {
      console.log("bootrom" + addr.toString(16));
      return this.bootRom.readByte(addr);
    }

    if (addr <= MEMORY_MAP.ROM_0.END) {
      console.log("rom0" + addr.toString(16));
      return this.cartridge.getRomByte(addr);
    }

    if (addr <= MEMORY_MAP.ROM_N.END) {
      return this.cartridge.getRomByte(addr);
    }

    if (addr <= MEMORY_MAP.VRAM.END) {
      return this.ppu.getVRAMByte(addr);
    }

    if (addr <= MEMORY_MAP.EXTERNAL_RAM.END) {
      return this.cartridge.getExternalRamByte(addr);
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

      if (addr <= IO_MAP.BOOT_ROM_DISABLE.END) {
        return this.bootRom.isEnabled() ? 0x01 : 0x00;
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
      return this.cartridge.setRom0Byte(addr, value);
    } // ROM

    if (addr <= MEMORY_MAP.VRAM.END) {
      return this.ppu.setVRAMByte(addr, value);
    }

    if (addr <= MEMORY_MAP.EXTERNAL_RAM.END) {
      return this.cartridge.setExternalRamByte(addr, value);
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

      // desactivar Boot ROM escribiendo 1 en 0xFF50
      if (addr === IO_MAP.BOOT_ROM_DISABLE.END) {
        if (value !== 0) this.bootRom.disable();
        return;
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
    this.timer.reset();
    this.bootRom.reset();
    this.interrupts.reset();
    this.ram.reset();
    this.ppu.clear();
  }
}
