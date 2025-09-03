import { IO_MAP, MEMORY_MAP } from "../utils/const/memory-map.const";

export class PPU {
  public VIDEO_WIDTH = 160;
  public VIDEO_HEIGHT = 144;

  private IORegister = new Uint8Array(0xc); // 0xFF40–0xFF4B
  private VRAM = new Uint8Array(0x2000); // 0x8000–0x9FFF
  private OAM = new Uint8Array(0xa0); // 0xFE00–0xFE9F

  private display: Uint8Array;
  private imageData: ImageData;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, private readonly scale: number = 4) {
    this.display = new Uint8Array(this.VIDEO_WIDTH * this.VIDEO_HEIGHT);
    this.imageData = new ImageData(
      this.VIDEO_WIDTH * this.scale,
      this.VIDEO_HEIGHT * this.scale
    );

    canvas.width = this.VIDEO_WIDTH * this.scale;
    canvas.height = this.VIDEO_HEIGHT * this.scale;

    this.ctx = canvas.getContext("2d")!;
  }

  clear() {
    this.IORegister.fill(0);
    this.OAM.fill(0);
    this.display.fill(0);
    this.render();
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

  getIOByte(address: number) {
    if (!this.validateIOAddress(address)) {
      console.warn(
        `Attempt to read from invalid IO address: ${address.toString(16)}`
      );
      return 0xff;
    }

    return this.IORegister[address - IO_MAP.PPU.START];
  }

  writeIOByte(address: number, value: number) {
    if (!this.validateIOAddress(address)) {
      console.warn(
        `Attempt to write to invalid IO address: ${address.toString(16)}`
      );
      return;
    }

    this.IORegister[address - IO_MAP.PPU.START] = value;
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

  public getPixel(x: number, y: number): number {
    x = x % this.VIDEO_WIDTH;
    y = y % this.VIDEO_HEIGHT;
    const index = y * this.VIDEO_WIDTH + x;
    return this.display[index];
  }

  public setPixel(x: number, y: number, color: number) {
    x = x % this.VIDEO_WIDTH;
    y = y % this.VIDEO_HEIGHT;
    const index = y * this.VIDEO_WIDTH + x;
    this.display[index] = color;
  }

  public render() {
    const data = this.imageData.data;

    for (let y = 0; y < this.VIDEO_HEIGHT; y++) {
      for (let x = 0; x < this.VIDEO_WIDTH; x++) {
        const pixel = this.getPixel(x, y);

        // Escalar el píxel en bloques de `scale x scale`
        for (let dy = 0; dy < this.scale; dy++) {
          for (let dx = 0; dx < this.scale; dx++) {
            const px =
              (y * this.scale + dy) * (this.VIDEO_WIDTH * this.scale) +
              (x * this.scale + dx);
            const idx = px * 4;
            data[idx] = pixel; // R
            data[idx + 1] = pixel; // G
            data[idx + 2] = pixel; // B
            data[idx + 3] = 0xff; // A
          }
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
