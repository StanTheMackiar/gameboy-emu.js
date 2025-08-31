import { CPU, Display, Memory } from "../../emu";
import { CPUStatusEnum } from "../enum/cpu-status.enum";
import type { EmulatorConfig } from "../interfaces/emu-config.interface";

export class GameBoyEmulator {
  private memory: Memory;
  private display: Display;
  private cpu: CPU;

  config: EmulatorConfig = {
    TIMER_HZ: 60,
    STEPS_BY_FRAME: 10,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.memory = new Memory();
    this.display = new Display(canvas);

    this.cpu = new CPU(this.memory, this.display);
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

    this.display.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  public start() {
    this.loop();
  }
}
