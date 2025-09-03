import { IO_TIMER_ADDRESSES } from "../../utils/const/memory-map.const";

export class Timer {
  private DIV!: number; // Divider Register
  private TIMA!: number; // Timer Counter Register
  private TMA!: number; // Timer Modulo Register
  private TAC!: number; // Timer Control Register

  constructor() {
    this.reset();
  }

  reset() {
    this.DIV = 0xab;
    this.TIMA = 0;
    this.TMA = 0;
    this.TAC = 0xf8;
  }

  readByte(address: number): number {
    switch (address) {
      case IO_TIMER_ADDRESSES.DIV:
        return this.DIV;
      case IO_TIMER_ADDRESSES.TIMA:
        return this.TIMA;
      case IO_TIMER_ADDRESSES.TMA:
        return this.TMA;
      case IO_TIMER_ADDRESSES.TAC:
        return this.TAC;
      default:
        return 0xff;
    }
  }

  writeByte(address: number, value: number): void {
    switch (address) {
      case IO_TIMER_ADDRESSES.DIV:
        this.DIV = value;
        break;
      case IO_TIMER_ADDRESSES.TIMA:
        this.TIMA = value;
        break;
      case IO_TIMER_ADDRESSES.TMA:
        this.TMA = value;
        break;
      case IO_TIMER_ADDRESSES.TAC:
        this.TAC = value;
        break;
    }
  }
}
