import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import {
  LDABC,
  LDADE,
  LDAnn,
  LDBCA,
  LDDEA,
  LDHAC,
  LDHAn,
  LDHLn,
  LDHnA,
  LDnnA,
  LDrn,
  LDrr,
} from "./instructions";
import type { MMU } from "./mmu";

export class CPU {
  PC_START = 0x100;
  CPU_HZ = 4.19 * 1000000; // 4.19 MHz

  public PC: number;
  private SP: number;

  public registers = {
    A: 0,
    F: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    H: 0,
    L: 0,
  };

  public status: CPUStatusEnum;
  private cycles = 0;

  constructor(public readonly mmu: MMU) {
    this.PC = this.PC_START;
    this.status = CPUStatusEnum.RUNNING;
  }

  public start() {
    if (this.status === CPUStatusEnum.RUNNING) return;

    this.status = CPUStatusEnum.RUNNING;
  }

  public incrementPC(quantity = 1) {
    this.PC = (this.PC + quantity) & 0xffff;
  }

  public getHL(): number {
    return (this.registers.H << 8) | this.registers.L;
  }

  getRegister(address: number): number {
    switch (address) {
      case 0:
        return this.registers.B;
      case 1:
        return this.registers.C;
      case 2:
        return this.registers.D;
      case 3:
        return this.registers.E;
      case 4:
        return this.registers.H;
      case 5:
        return this.registers.L;
      case 6:
        return this.mmu.readByte(this.getHL());
      case 7:
        return this.registers.A;
      default:
        throw new Error(
          "Invalid register code: " + this.getRegisterName(address)
        );
    }
  }

  setRegister(address: number, value: number): void {
    value &= 0xff;
    switch (address) {
      case 0:
        this.registers.B = value;
        break;
      case 1:
        this.registers.C = value;
        break;
      case 2:
        this.registers.D = value;
        break;
      case 3:
        this.registers.E = value;
        break;
      case 4:
        this.registers.H = value;
        break;
      case 5:
        this.registers.L = value;
        break;
      case 6:
        this.mmu.writeByte(this.getHL(), value);
        break;
      case 7:
        this.registers.A = value;
        break;
      default:
        throw new Error(
          "Invalid register code: " + this.getRegisterName(address)
        );
    }
  }

  getRegisterName(code: number): string {
    return ["B", "C", "D", "E", "H", "L", "(HL)", "A"][code];
  }

  private resetRegisters() {
    this.registers = {
      A: 0,
      F: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      H: 0,
      L: 0,
    };
  }

  public async reset() {
    this.stop();

    this.start();
  }

  public pause() {
    this.status = CPUStatusEnum.PAUSED;
  }

  public stop() {
    this.PC = this.PC_START;
    this.resetRegisters();

    this.mmu.reset();
    this.status = CPUStatusEnum.STOPPED;
  }

  private fetchOpcode(): number {
    const opcode = this.mmu.readByte(this.PC);
    this.PC++;
    return opcode;
  }

  public incrementCycles(value: number) {
    this.cycles += value * 4;
  }

  public step(): { status: CPUStatusEnum } {
    if (this.status !== CPUStatusEnum.RUNNING) {
      return { status: this.status };
    }

    const opcode = this.fetchOpcode();

    try {
      this.executeInstruction(opcode);
    } catch (err) {
      console.error(err);

      this.status = CPUStatusEnum.STOPPED;
    }

    return { status: this.status };
  }

  private executeInstruction(opcode: number) {
    switch ((opcode & 0b11000000) >> 6) {
      case 0b00: {
        if ((opcode & 0b111) === 0b110) LDrn(opcode, this);
        if (opcode === 0x36) LDHLn(this);
        if (opcode === 0x0a) LDABC(this);
        if (opcode === 0x1a) LDADE(this);
        if (opcode === 0x02) LDBCA(this);
        if (opcode === 0x12) LDDEA(this);

        break;
      }
      case 0b01: {
        LDrr(opcode, this);
        break;
      }
      case 0b11: {
        if (opcode === 0xfa) LDAnn(this);
        if (opcode === 0xea) LDnnA(this);
        if (opcode === 0xf2) LDHAC(this);
        if (opcode === 0xe2) LDHAC(this);
        if (opcode === 0xf0) LDHAn(this);
        if (opcode === 0xe0) LDHnA(this);
        break;
      }

      default: {
        console.warn(`Unhandled opcode: 0x${opcode.toString(16)}`);
        this.status = CPUStatusEnum.STOPPED;

        break;
      }
    }
  }
}
