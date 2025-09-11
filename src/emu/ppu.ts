import {
  IO_MAP,
  MEMORY_MAP,
  PPU_ADDRESSES,
} from "../utils/const/memory-map.const";
import { InterruptTypeEnum } from "../utils/enum/interrupt-type.enum";
import type { Interrupts } from "./io/interrupts";

export enum PpuMode {
  HBlank = 0,
  VBlank = 1,
  OAM = 2,
  VRAM = 3,
}

interface Sprite {
  y: number;
  x: number;
  tile: number;
  attributes: number;
}

export class PPU {
  public VIDEO_WIDTH = 160;
  public VIDEO_HEIGHT = 144;

  private IO = new Uint8Array(0xc); // 0xFF40–0xFF4B
  private VRAM = new Uint8Array(0x2000); // 0x8000–0x9FFF
  private OAM = new Uint8Array(0xa0); // 0xFE00–0xFE9F

  private readonly ctx: CanvasRenderingContext2D;
  private readonly scale: number = 4;

  // PPU state
  private mode: PpuMode = PpuMode.OAM;
  private modeCycles: number = 0;
  private scanline: number = 0;
  private display = new Uint8ClampedArray(
    this.VIDEO_WIDTH * this.VIDEO_HEIGHT * 4
  ); // RGBA for each pixel

  private palette: [number, number, number][] = [
    [255, 255, 255], // 0 - blanco
    [192, 192, 192], // 1 - gris claro
    [96, 96, 96], // 2 - gris oscuro
    [0, 0, 0], // 3 - negro
  ];

  constructor(
    canvas: HTMLCanvasElement,
    private readonly interrupts: Interrupts
  ) {
    canvas.width = this.VIDEO_WIDTH * this.scale;
    canvas.height = this.VIDEO_HEIGHT * this.scale;

    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.scale(this.scale, this.scale); // <- importante
  }

  clear(color: [number, number, number] = [0, 0, 0]) {
    this.IO.fill(0);
    this.VRAM.fill(0);
    this.OAM.fill(0);
    this.mode = PpuMode.OAM;
    this.modeCycles = 0;
    this.scanline = 0;

    for (let y = 0; y < this.VIDEO_HEIGHT; y++) {
      for (let x = 0; x < this.VIDEO_WIDTH; x++) {
        this.setPixel(x, y, color);
      }
    }

    this.render();
  }

  private getTilePixel(
    tileIndex: number,
    row: number,
    col: number,
    bgTileDataBase: number
  ): number {
    let tileAddr: number;
    if (bgTileDataBase === 0x0000) {
      tileAddr = tileIndex * 16;
    } else {
      const signedIndex = (tileIndex << 24) >> 24;
      tileAddr = 0x0800 + signedIndex * 16;
    }

    const low = this.VRAM[tileAddr + row * 2];
    const high = this.VRAM[tileAddr + row * 2 + 1];
    const bit = 7 - col;
    return (((high >> bit) & 1) << 1) | ((low >> bit) & 1);
  }

  private getPaletteColor(paletteByte: number, colorIndex: number) {
    const mapped = (paletteByte >> (colorIndex * 2)) & 0x03;
    return this.palette[mapped];
  }

  private getBGP(color: number) {
    const palette = this.IO[PPU_ADDRESSES.BGP - IO_MAP.PPU.START];
    return this.getPaletteColor(palette, color);
  }

  private getOBP0(color: number) {
    const palette = this.IO[PPU_ADDRESSES.OBP0 - IO_MAP.PPU.START];
    return this.getPaletteColor(palette, color);
  }

  private getOBP1(color: number) {
    const palette = this.IO[PPU_ADDRESSES.OBP1 - IO_MAP.PPU.START];
    return this.getPaletteColor(palette, color);
  }

  public drawScanline(scanline: number) {
    const lcdc = this.IO[PPU_ADDRESSES.LCDC - IO_MAP.PPU.START];
    const SCX = this.IO[PPU_ADDRESSES.SCX - IO_MAP.PPU.START];
    const SCY = this.IO[PPU_ADDRESSES.SCY - IO_MAP.PPU.START];
    const WX = this.IO[PPU_ADDRESSES.WX - IO_MAP.PPU.START] - 7;
    const WY = this.IO[PPU_ADDRESSES.WY - IO_MAP.PPU.START];

    const bgTileMapBase = lcdc & 0x08 ? 0x1c00 : 0x1800;
    const bgTileDataBase = lcdc & 0x10 ? 0x0000 : 0x0800;
    const useWindow = lcdc & 0x20 && scanline >= WY;

    for (let x = 0; x < this.VIDEO_WIDTH; x++) {
      let tileIndex: number, lineInTile: number, pixelCol: number;

      if (useWindow && x >= WX) {
        const wx = x - WX;
        const wy = scanline - WY;
        tileIndex =
          this.VRAM[
            bgTileMapBase + Math.floor(wy / 8) * 32 + Math.floor(wx / 8)
          ];
        lineInTile = wy % 8;
        pixelCol = wx % 8;
      } else {
        const bx = (x + SCX) & 0xff;
        const by = (scanline + SCY) & 0xff;
        tileIndex =
          this.VRAM[
            bgTileMapBase + Math.floor(by / 8) * 32 + Math.floor(bx / 8)
          ];
        lineInTile = by % 8;
        pixelCol = bx % 8;
      }

      const color = this.getBGP(
        this.getTilePixel(tileIndex, lineInTile, pixelCol, bgTileDataBase)
      );
      this.setPixel(x, scanline, color);
    }

    this.drawSprites(scanline);
  }

  private drawSprites(scanline: number) {
    const lcdc = this.IO[PPU_ADDRESSES.LCDC - IO_MAP.PPU.START];
    const spriteHeight = lcdc & 0x04 ? 16 : 8;
    const bgTileDataBase = lcdc & 0x10 ? 0x0000 : 0x0800;

    const sprites: Sprite[] = [];
    for (let i = 0; i < 40; i++) {
      const y = this.OAM[i * 4] - 16;
      const x = this.OAM[i * 4 + 1] - 8;
      const tile = this.OAM[i * 4 + 2];
      const attr = this.OAM[i * 4 + 3];
      if (scanline >= y && scanline < y + spriteHeight) {
        sprites.push({ x, y, tile, attributes: attr });
        if (sprites.length >= 10) break;
      }
    }

    for (const sprite of sprites) {
      const lineInTile = scanline - sprite.y;
      const flippedY =
        sprite.attributes & 0x40 ? spriteHeight - 1 - lineInTile : lineInTile;

      for (let col = 0; col < 8; col++) {
        const flippedX = sprite.attributes & 0x20 ? 7 - col : col;
        const colorIndex = this.getTilePixel(
          sprite.tile,
          flippedY,
          flippedX,
          bgTileDataBase
        );
        if (colorIndex === 0) continue;
        const palette =
          sprite.attributes & 0x10
            ? this.getOBP1(colorIndex)
            : this.getOBP0(colorIndex);
        if (!(sprite.attributes & 0x80))
          this.setPixel(sprite.x + col, scanline, palette);
      }
    }
  }

  private setPixel(x: number, y: number, color: [number, number, number]) {
    if (x < 0 || x >= this.VIDEO_WIDTH || y < 0 || y >= this.VIDEO_HEIGHT)
      return;

    const idx = (y * this.VIDEO_WIDTH + x) * 4;
    this.display[idx] = color[0];
    this.display[idx + 1] = color[1];
    this.display[idx + 2] = color[2];
    this.display[idx + 3] = 255;
  }

  public tick(stepCycles: number) {
    this.modeCycles += stepCycles;
    this.IO[PPU_ADDRESSES.LY - IO_MAP.PPU.START] = this.scanline;

    const STATidx = PPU_ADDRESSES.STAT - IO_MAP.PPU.START;

    switch (this.mode) {
      case PpuMode.OAM:
        if (this.modeCycles >= 80) {
          this.modeCycles -= 80;
          this.mode = PpuMode.VRAM;

          if (this.IO[STATidx] & 0x20) {
            this.interrupts.requestInterrupt(InterruptTypeEnum.LCD_STAT);
          }
        }
        break;

      case PpuMode.VRAM:
        if (this.modeCycles >= 172) {
          this.modeCycles -= 172;
          this.mode = PpuMode.HBlank;
          this.drawScanline(this.scanline);

          if (this.IO[STATidx] & 0x08) {
            this.interrupts.requestInterrupt(InterruptTypeEnum.LCD_STAT);
          }
        }
        break;

      case PpuMode.HBlank:
        if (this.modeCycles >= 204) {
          this.modeCycles -= 204;
          this.scanline++;

          if (this.scanline >= 144) {
            this.mode = PpuMode.VBlank;
            this.interrupts.requestInterrupt(InterruptTypeEnum.VBLANK);

            if (this.IO[STATidx] & 0x10) {
              this.interrupts.requestInterrupt(InterruptTypeEnum.LCD_STAT);
            }
          } else {
            this.mode = PpuMode.OAM;
          }
        }
        break;

      case PpuMode.VBlank:
        if (this.modeCycles >= 456) {
          this.modeCycles -= 456;
          this.scanline++;
          if (this.scanline > 153) {
            this.scanline = 0;
            this.mode = PpuMode.OAM;
          }
        }
        break;
    }

    // LYC=LY
    const LYC = this.IO[PPU_ADDRESSES.LYC - IO_MAP.PPU.START];

    if (this.scanline === LYC) {
      this.IO[STATidx] |= 0x04;

      if (this.IO[STATidx] & 0x40) {
        this.interrupts.requestInterrupt(InterruptTypeEnum.LCD_STAT);
      }
    } else {
      this.IO[STATidx] &= ~0x04;
    }

    // actualizar modo en STAT
    this.IO[STATidx] = (this.IO[STATidx] & 0xfc) | this.mode;
  }

  public render() {
    const imageData = new ImageData(
      this.display,
      this.VIDEO_WIDTH,
      this.VIDEO_HEIGHT
    );

    this.ctx.putImageData(imageData, 0, 0);
    // luego en render():
    this.ctx.drawImage(
      this.ctx.canvas,
      0,
      0,
      this.VIDEO_WIDTH * this.scale,
      this.VIDEO_HEIGHT * this.scale
    );
  }

  getIOByte(address: number) {
    if (!this.validateIOAddress(address)) {
      console.warn(
        `Attempt to read from invalid IO address: ${address.toString(16)}`
      );
      return 0xff;
    }

    return this.IO[address - IO_MAP.PPU.START];
  }

  writeIOByte(address: number, value: number) {
    if (!this.validateIOAddress(address)) {
      console.warn(
        `Attempt to write to invalid IO address: ${address.toString(16)}`
      );
      return;
    }

    this.IO[address - IO_MAP.PPU.START] = value;
  }

  getVRAMByte(address: number) {
    if (!this.validateVRAMAddress(address)) {
      console.warn(
        `Attempt to read from invalid VRAM address: ${address.toString(16)}`
      );
      return 0xff;
    }

    return this.VRAM[address - MEMORY_MAP.VRAM.START];
  }

  setVRAMByte(address: number, value: number) {
    if (!this.validateVRAMAddress(address)) {
      console.warn(
        `Attempt to write to invalid VRAM address: ${address.toString(16)}`
      );
      return;
    }

    this.VRAM[address - MEMORY_MAP.VRAM.START] = value;
  }

  getOAMByte(address: number) {
    if (!this.validateOAMAddress(address)) {
      console.warn(
        `Attempt to read from invalid OAM address: ${address.toString(16)}`
      );
      return 0xff;
    }

    return this.OAM[address - MEMORY_MAP.OAM.START];
  }

  setOAMByte(address: number, value: number) {
    if (!this.validateOAMAddress(address)) {
      console.warn(
        `Attempt to write to invalid OAM address: ${address.toString(16)}`
      );
      return;
    }

    this.OAM[address - MEMORY_MAP.OAM.START] = value;
  }

  private validateVRAMAddress(address: number): boolean {
    return address >= MEMORY_MAP.VRAM.START && address <= MEMORY_MAP.VRAM.END;
  }

  private validateOAMAddress(address: number): boolean {
    return address >= MEMORY_MAP.OAM.START && address <= MEMORY_MAP.OAM.END;
  }

  private validateIOAddress(address: number): boolean {
    return address >= IO_MAP.PPU.START && address <= IO_MAP.PPU.END;
  }
}
