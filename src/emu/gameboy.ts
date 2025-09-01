import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import type { EmulatorConfig } from "../utils/interfaces/emu-config.interface";
import { CPU, MMU, PPU } from "./";

export class GameBoyEmulator {
  private memory: MMU;
  private ppu: PPU;
  private cpu: CPU;

  config: EmulatorConfig = {
    TIMER_HZ: 60,
    STEPS_BY_FRAME: 10,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.memory = new MMU();

    this.ppu = new PPU(this.memory, canvas);
    this.cpu = new CPU(this.memory, this.ppu);
  }

  private loop() {
    if (this.cpu.status !== CPUStatusEnum.RUNNING) {
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    for (let i = 0; i < this.config.STEPS_BY_FRAME; i++) {
      const { status } = this.cpu.step();
      if (status !== CPUStatusEnum.RUNNING) break;
    }

    this.ppu.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  public start() {
    this.loop();
  }
}
