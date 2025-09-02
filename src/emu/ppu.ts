export class PPU {
  public VIDEO_WIDTH = 160;
  public VIDEO_HEIGHT = 144;
  ADDRESSES = {
    VRAM: {
      START: 0x8000,
      END: 0x9fff,
    },
    OAM: {
      START: 0xfe00,
      END: 0xfe9f,
    },
  };

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
    this.display.fill(0);
    this.render();
  }

  private validateVRAMAddress(address: number): boolean {
    return (
      address >= this.ADDRESSES.VRAM.START && address <= this.ADDRESSES.VRAM.END
    );
  }

  private validateOAMAddress(address: number): boolean {
    return (
      address >= this.ADDRESSES.OAM.START && address <= this.ADDRESSES.OAM.END
    );
  }

  getVRAMByte(address: number) {
    if (!this.validateVRAMAddress(address)) {
      throw new Error(`Invalid VRAM address: ${address.toString(16)}`);
    }

    return this.VRAM[address - this.ADDRESSES.VRAM.START];
  }

  setVRAMByte(address: number, value: number) {
    if (!this.validateVRAMAddress(address)) {
      throw new Error(`Invalid VRAM address: ${address.toString(16)}`);
    }

    this.VRAM[address - this.ADDRESSES.VRAM.START] = value;
  }

  getOAMByte(address: number) {
    if (!this.validateOAMAddress(address)) {
      throw new Error(`Invalid OAM address: ${address.toString(16)}`);
    }

    return this.OAM[address - this.ADDRESSES.OAM.START];
  }

  setOAMByte(address: number, value: number) {
    if (!this.validateOAMAddress(address)) {
      throw new Error(`Invalid OAM address: ${address.toString(16)}`);
    }

    this.OAM[address - this.ADDRESSES.OAM.START] = value;
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
