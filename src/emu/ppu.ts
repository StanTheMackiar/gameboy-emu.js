import type { Memory } from "./memory";

export class PPU {
  OAM_SIZE = 160; // 160 bytes
  public VIDEO_WIDTH = 160;
  public VIDEO_HEIGHT = 144;

  private oam: Uint8Array;
  private display: Uint8Array;
  private imageData: ImageData;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    memory: Memory,
    canvas: HTMLCanvasElement,
    private readonly scale: number = 4
  ) {
    this.oam = new Uint8Array(this.OAM_SIZE);
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
