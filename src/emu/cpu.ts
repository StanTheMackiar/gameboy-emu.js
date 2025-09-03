import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import type { MMU } from "./mmu";

export class CPU {
  PC_START = 0x100;
  CPU_HZ = 4.19 * 1000000; // 4.19 MHz

  private PC: number;
  private SP: number;

  private BC: number;
  private DE: number;
  private HL: number;
  private IR: number;

  private registers: Uint8Array; // A, F, B, C, D, E, H, L
  public status: CPUStatusEnum;

  constructor(private readonly mmu: MMU) {
    this.registers = new Uint8Array(8);
    this.PC = this.PC_START;
    this.status = CPUStatusEnum.RUNNING;
  }

  public start() {
    if (this.status === CPUStatusEnum.RUNNING) return;

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

    this.mmu.reset();
    this.status = CPUStatusEnum.STOPPED;
  }

  step(): { status: CPUStatusEnum } {
    return { status: this.status };
  }
}
