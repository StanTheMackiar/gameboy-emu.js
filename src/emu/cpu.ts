import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import type { Display, Memory } from "./";

export class CPU {
  PC_START = 0x100;

  private registers: Uint8Array;
  private PC: number;
  public status: CPUStatusEnum;

  constructor(
    private readonly memory: Memory,
    private readonly display: Display
  ) {
    this.registers = new Uint8Array(8);
    this.PC = this.PC_START;
    this.status = CPUStatusEnum.RUNNING;
  }

  public start() {
    this.status = CPUStatusEnum.RUNNING;
  }

  public async restart() {
    this.stop();

    this.start();
  }

  public pause() {
    this.status = CPUStatusEnum.PAUSED;
  }

  public stop() {
    this.PC = this.PC_START;
    this.registers.fill(0);

    this.memory.reset();
    this.display.clear();
    this.status = CPUStatusEnum.STOPPED;
  }

  step(): { status: CPUStatusEnum } {
    return { status: this.status };
  }
}
