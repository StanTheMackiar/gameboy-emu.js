import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import { InterruptTypeEnum } from "../utils/enum/interrupt-type.enum";
import {
  ADCn,
  ADCr,
  ADDHLrr,
  ADDn,
  ADDr,
  ADDSPe,
  ANDn,
  ANDr,
  CCF,
  CPL,
  CPn,
  DAA,
  DECr,
  DECrr,
  INCr,
  INCrr,
  LDABC,
  LDADE,
  LDAHLd,
  LDAHLi,
  LDAnn,
  LDBCA,
  LDDEA,
  LDHAC,
  LDHAn,
  LDHLdA,
  LDHLiA,
  LDHLn,
  LDHLSPe,
  LDHnA,
  LDnnA,
  LDnnSP,
  LDrn,
  LDrr,
  LDrrnn,
  LDSPHL,
  ORr,
  POPrr,
  PUSHrr,
  RLA,
  RLCA,
  RLCr,
  RRA,
  RRCA,
  RRCr,
  SBCn,
  SBCr,
  SCF,
  SUBn,
  SUBr,
  XORn,
} from "./instructions";
import type { MMU } from "./mmu";

export class CPU {
  PC_START = 0x000;
  SP_START = 0xfffe;

  public PC: number;
  public SP: number;

  public flags = {
    Z: 0,
    N: 0,
    H: 0,
    C: 0,
  };

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
  private stepCycles = 0;

  constructor(public readonly mmu: MMU) {
    this.PC = this.PC_START;
    this.SP = this.SP_START;
    this.status = CPUStatusEnum.RUNNING;
  }

  public start() {
    if (this.status === CPUStatusEnum.RUNNING) return;

    this.status = CPUStatusEnum.RUNNING;
  }

  setHL(value: number) {
    this.registers.H = this.msb(value);
    this.registers.L = this.lsb(value);
  }

  public getHL(): number {
    return (this.registers.H << 8) | this.registers.L;
  }

  get16BitRegister(address: number): number {
    switch (address) {
      case 0b00: // BC
        return (this.registers.B << 8) | this.registers.C;
      case 0b01: // DE
        return (this.registers.D << 8) | this.registers.E;
      case 0b10: // HL
        return (this.registers.H << 8) | this.registers.L;
      case 0b11: // AF
        return (this.registers.A << 8) | (this.registers.F & 0xf0);
      default:
        throw new Error("Invalid 16 bit register code: " + address);
    }
  }

  set16BitRegister(address: number, value: number) {
    switch (address) {
      case 0b00: // BC
        this.registers.B = this.msb(value);
        this.registers.C = this.lsb(value);
        break;
      case 0b01: // DE
        this.registers.D = this.msb(value);
        this.registers.E = this.lsb(value);
        break;
      case 0b10: // HL
        this.setHL(value);
        break;
      case 0b11: // AF
        this.registers.A = this.msb(value);
        this.registers.F = this.lsb(value) & 0xf0;
        break;
      default:
        throw new Error("Invalid 16 bit register code: " + address);
    }
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
        this.registers.B = value & 0xff;
        break;
      case 1:
        this.registers.C = value & 0xff;
        break;
      case 2:
        this.registers.D = value & 0xff;
        break;
      case 3:
        this.registers.E = value & 0xff;
        break;
      case 4:
        this.registers.H = value & 0xff;
        break;
      case 5:
        this.registers.L = value & 0xff;
        break;
      case 6:
        this.mmu.writeByte(this.getHL(), value & 0xff);
        break;
      case 7:
        this.registers.A = value & 0xff;
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

  public setStepCycles(value: number) {
    this.stepCycles = value * 4;
  }

  public updateCycles() {
    this.cycles += this.stepCycles * 4;
  }

  public step(): { status: CPUStatusEnum; stepCycles: number } {
    this.stepCycles = 0;

    if (!this.mmu.cartridge.hasROM()) {
      this.status = CPUStatusEnum.STOPPED;
      this.stop();
      console.warn("No ROM loaded");

      return { status: this.status, stepCycles: this.stepCycles };
    }

    if (this.status !== CPUStatusEnum.RUNNING) {
      return { status: this.status, stepCycles: this.stepCycles };
    }

    const opcode = this.fetchOpcode();

    try {
      this.executeInstruction(opcode);
    } catch (err) {
      console.error(err);

      this.stepCycles = 0;
      this.status = CPUStatusEnum.STOPPED;
    }

    return { status: this.status, stepCycles: this.stepCycles };
  }

  public lsb(value: number): number {
    return value & 0xff;
  }

  public msb(value: number): number {
    return (value >> 8) & 0xff;
  }

  public handleInterrupt(type: InterruptTypeEnum) {
    // 1. Deshabilitar interrupciones globales
    this.mmu.interrupts.IME = false;

    // 2. Limpiar el flag de la interrupción atendida
    this.mmu.interrupts.clearInterrupt(type);

    // 3. Guardar el PC actual en la pila
    this.pushWord(this.PC);

    // 4. Saltar al vector de interrupción
    switch (type) {
      case InterruptTypeEnum.VBLANK:
        this.PC = 0x40;
        break;
      case InterruptTypeEnum.LCD_STAT:
        this.PC = 0x48;
        break;
      case InterruptTypeEnum.TIMER:
        this.PC = 0x50;
        break;
      case InterruptTypeEnum.SERIAL:
        this.PC = 0x58;
        break;
      case InterruptTypeEnum.JOYPAD:
        this.PC = 0x60;
        break;
    }
  }

  private pushWord(value: number) {
    this.SP = (this.SP - 1) & 0xffff;
    this.mmu.writeByte(this.SP, (value >> 8) & 0xff); // high
    this.SP = (this.SP - 1) & 0xffff;
    this.mmu.writeByte(this.SP, value & 0xff); // low
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
        if (opcode === 0x3a) LDAHLd(this);
        if (opcode === 0x32) LDHLdA(this);
        if (opcode === 0x2a) LDAHLi(this);
        if (opcode === 0x22) LDHLiA(this);
        if ((opcode & 0b1111) === 0b0001) LDrrnn(opcode, this);
        if (opcode === 0x08) LDnnSP(this);
        if ((opcode & 0b111) === 0b100) INCr(opcode, this);
        if ((opcode & 0b111) === 0b101) DECr(opcode, this);
        if (opcode === 0xe6) ANDn(this);
        if (opcode === 0x3f) CCF(this);
        if (opcode === 0x37) SCF(this);
        if (opcode === 0x27) DAA(this);
        if (opcode === 0x2f) CPL(this);
        if ((opcode & 0b1111) === 0b0011) INCrr(opcode, this);
        if ((opcode & 0b1111) === 0b1011) DECrr(opcode, this);
        if ((opcode & 0b1111) === 0b1001) ADDHLrr(opcode, this);
        if (opcode === 0x07) RLCA(this);
        if (opcode === 0x0f) RRCA(this);
        if (opcode === 0x17) RLA(this);
        if (opcode === 0x1f) RRA(this);
        if ((opcode & 0b11111000) >> 3 === 0b00000) RLCr(opcode, this);
        if ((opcode & 0b11111000) >> 3 === 0b00001) RRCr(opcode, this);
        if ((opcode & 0b11111000) >> 3 === 0b00010) RRCr(opcode, this);

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
        if (opcode === 0xf9) LDSPHL(this);
        if ((opcode & 0b1111) === 0b0101) PUSHrr(opcode, this);
        if ((opcode & 0b1111) === 0b0001) POPrr(opcode, this);
        if (opcode === 0xf8) LDHLSPe(this);
        if (opcode === 0xde) SBCn(this);
        if (opcode === 0xfe) CPn(this);
        if (opcode === 0xee) XORn(this);
        if (opcode === 0xe8) ADDSPe(this);
        break;
      }

      case 0b10: {
        // ALU operations
        if ((opcode & 0b11111000) >> 3 === 0b10000) ADDr(opcode, this);
        if (opcode === 0xc6) ADDn(this);
        if ((opcode & 0b11111000) >> 3 === 0b10001) ADCr(opcode, this);
        if (opcode === 0xce) ADCn(this);
        if ((opcode & 0b11111000) >> 3 === 0b10010) SUBr(opcode, this);
        if (opcode === 0xd6) SUBn(this);
        if ((opcode & 0b11111000) >> 3 === 0b10011) SBCr(opcode, this);
        if ((opcode & 0b11111000) >> 3 === 0b10100) ANDr(opcode, this);
        if ((opcode & 0b11111000) >> 3 === 0b10110) ORr(opcode, this);
        if ((opcode & 0b11111000) >> 3 === 0b10101) ORr(opcode, this);

        break;
      }

      default: {
        console.warn(`Unhandled opcode: 0x${opcode.toString(16)}`);
        this.status = CPUStatusEnum.STOPPED;

        break;
      }
    }

    this.updateCycles();
  }
}
