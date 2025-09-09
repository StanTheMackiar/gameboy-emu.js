import { TIMER_ADDRESSES } from "../../utils/const/memory-map.const";
import { InterruptTypeEnum } from "../../utils/enum/interrupt-type.enum";
import type { Interrupts } from "./interrupts";

export class Timer {
  private DIV!: number; // Divider Register
  private TIMA!: number; // Timer Counter Register
  private TMA!: number; // Timer Modulo Register
  private TAC!: number; // Timer Control Register

  private divCounter: number = 0;
  private timaCounter: number = 0;
  private timaOverflowed: boolean = false;

  constructor(private interrupts: Interrupts) {
    this.reset();
  }

  reset() {
    this.DIV = 0;
    this.TIMA = 0;
    this.TMA = 0;
    this.TAC = 0xf8;
  }

  readByte(address: number): number {
    switch (address) {
      case TIMER_ADDRESSES.DIV:
        return this.DIV;
      case TIMER_ADDRESSES.TIMA:
        return this.TIMA;
      case TIMER_ADDRESSES.TMA:
        return this.TMA;
      case TIMER_ADDRESSES.TAC:
        return this.TAC;
      default:
        return 0xff;
    }
  }

  writeByte(address: number, value: number): void {
    switch (address) {
      case TIMER_ADDRESSES.DIV:
        this.DIV = 0;
        this.divCounter = 0;
        break;
      case TIMER_ADDRESSES.TIMA:
        this.TIMA = value;
        break;
      case TIMER_ADDRESSES.TMA:
        this.TMA = value;
        break;
      case TIMER_ADDRESSES.TAC:
        this.TAC = (value & 0b111) | 0b11111000;
        break;
    }
  }

  tick(stepCycles: number): void {
    this.divCounter += stepCycles;

    if (this.divCounter >= 256) {
      this.DIV = (this.DIV + 1) & 0xff;
      this.divCounter -= 256;
    }

    //Si tima se desborda genera una interrupción
    if (this.timaOverflowed) {
      this.TIMA = this.TMA;
      this.timaOverflowed = false;
      this.interrupts.requestInterrupt(InterruptTypeEnum.TIMER);
    }

    // timer enabled
    if (this.TAC & 0b100) {
      this.timaCounter += stepCycles;

      const threshold = this.getTimerFrequency();

      while (this.timaCounter >= threshold) {
        this.timaCounter -= threshold;
        this.incrementTIMA();
      }
    }
  }

  private getTimerFrequency(): number {
    switch (this.TAC & 0b11) {
      case 0b00:
        return 1024;
      case 0b01:
        return 16;
      case 0b10:
        return 64;
      case 0b11:
        return 256;
      default:
        return 1024;
    }
  }

  private incrementTIMA() {
    this.TIMA++;

    if (this.TIMA > 0xff) {
      this.TIMA = 0;
      this.timaOverflowed = true;
    }
  }
}
