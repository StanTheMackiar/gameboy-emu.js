export const MEMORY_MAP = {
  ROM_0: {
    START: 0x0000,
    END: 0x3fff,
  },
  ROM_N: {
    START: 0x4000,
    END: 0x7fff,
  },
  VRAM: {
    START: 0x8000,
    END: 0x9fff,
  },
  EXTERNAL_RAM: {
    START: 0xa000,
    END: 0xbfff,
  },
  WRAM: {
    START: 0xc000,
    END: 0xdfff,
  },
  ECHO_RAM: {
    START: 0xe000,
    END: 0xfdff,
  },
  OAM: {
    START: 0xfe00,
    END: 0xfe9f,
  },
  NOT_USABLE: {
    START: 0xfea0,
    END: 0xfeff,
  },
  IO: {
    START: 0xff00,
    END: 0xff7f,
  },
  HRAM: {
    START: 0xff80,
    END: 0xfffe,
  },
  IE: {
    START: 0xffff,
    END: 0xffff,
  },
};

export const IO_MAP = {
  JOYPAD: {
    START: 0xff00,
    END: 0xff00,
  },
  SERIAL: {
    START: 0xff01,
    END: 0xff02,
  },
  TIMER: {
    START: 0xff04,
    END: 0xff07,
  },
  IF: {
    START: 0xff0f,
    END: 0xff0f,
  },
  APU_AUDIO: {
    START: 0xff10,
    END: 0xff26,
  },
  APU_WAVE: {
    START: 0xff30,
    END: 0xff3f,
  },
  PPU: {
    START: 0xff40,
    END: 0xff4b,
  },
  VRAM_BANK_SELECT: {
    START: 0xff4f,
    END: 0xff4f,
    CGB: true,
  },
  BOOT_ROM: {
    START: 0xff50,
    END: 0xff50,
  },
  VRAM_DMA: {
    START: 0xff51,
    END: 0xff55,
    CGB: true,
  },
  BG_OBJ_PALETTES: {
    START: 0xff68,
    END: 0xff6b,
    CGB: true,
  },
  WRAM_BANK_SELECT: {
    START: 0xff70,
    END: 0xff7f,
    CGB: true,
  },
};

export const TIMER_ADDRESSES = {
  DIV: 0xff04,
  TIMA: 0xff05,
  TMA: 0xff06,
  TAC: 0xff07,
};
