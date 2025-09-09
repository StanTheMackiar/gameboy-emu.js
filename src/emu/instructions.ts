import {
  checkBorrow8,
  checkCarry16,
  checkCarry8,
  checkHalfBorrow8,
  checkHalfCarry16,
  checkHalfCarry8,
} from "../utils/helpers/flags.helper";
import { toSigned8 } from "../utils/helpers/signed.helper";
import type { CPU } from "./cpu";

export const LDrn = (opcode: number, cpu: CPU) => {
  const reg = (opcode >> 3) & 0b111; // bits 3–5
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  cpu.setStepCycles(2);

  console.debug(`LD ${cpu.getRegisterName(reg)}, 0x${n.toString(16)}`);
};

export const LDHLn = (cpu: CPU) => {
  //Length 2: opcde + n
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  cpu.mmu.writeByte(cpu.getHL(), n);
  cpu.setStepCycles(3);

  console.debug(`LD (HL), 0x${n.toString(16)}`);
};

//LD r, r’
//0b01xxxyyy/various
export const LDrr = (opcode: number, cpu: CPU) => {
  const src = opcode & 0b111; // bits 0–2
  const dest = (opcode >> 3) & 0b111; // bits 3–5

  const registerDest = cpu.getRegister(dest);

  if (src === 0b110) {
    // LD (HL), r
    cpu.mmu.writeByte(cpu.getHL(), registerDest);
    cpu.setStepCycles(2);

    console.debug(`LD (HL), ${cpu.getRegisterName(dest)}`);

    return;
  }

  if (dest === 0b110) {
    // LD r, (HL)
    cpu.setRegister(src, registerDest);
    cpu.setStepCycles(2);

    console.debug(`LD ${cpu.getRegisterName(src)}, (HL)`);

    return;
  }

  //LD r, r
  cpu.setRegister(src, registerDest);
  cpu.setStepCycles(1);

  console.debug(`LD ${cpu.getRegisterName(src)}, ${cpu.getRegisterName(dest)}`);
};

export const LDABC = (cpu: CPU) => {
  const BC = (cpu.registers.B << 8) | cpu.registers.C;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(BC));
  cpu.setStepCycles(2);

  console.debug(`LD A, (BC)`);
};

export const LDADE = (cpu: CPU) => {
  const DE = (cpu.registers.D << 8) | cpu.registers.E;

  cpu.setRegister(7 /*A*/, cpu.mmu.readByte(DE));
  cpu.setStepCycles(2);

  console.debug(`LD A, (DE)`);
};

export const LDBCA = (cpu: CPU) => {
  const BC = (cpu.registers.B << 8) | cpu.registers.C;

  cpu.mmu.writeByte(BC, cpu.getRegister(7 /* A */));
  cpu.setStepCycles(2);

  console.debug(`LD (BC), A`);
};

export const LDDEA = (cpu: CPU) => {
  const DE = (cpu.registers.D << 8) | cpu.registers.E;

  cpu.mmu.writeByte(DE, cpu.getRegister(7 /* A */));
  cpu.setStepCycles(2);

  console.debug(`LD (DE), A`);
};

// LD A, (nn) - opcode 0xFA
export const LDAnn = (cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const address = ((nnMsb << 8) | nnLsb) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.setStepCycles(4);

  console.debug(`LD A, (nn)`);
};

//LD (nn), A - opcode 0xEA
export const LDnnA = (cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const address = ((nnMsb << 8) | nnLsb) & 0xffff;

  const registerA = cpu.getRegister(7);
  cpu.mmu.writeByte(address, registerA);
  cpu.setStepCycles(4);

  console.debug(`LD (nn), A`);
};

// LD A, (0xFF00 + C) - opcode 0xF2
export const LDHAC = (cpu: CPU) => {
  const registerC = cpu.getRegister(1);
  const address = (0xff00 + registerC) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.setStepCycles(2);

  console.debug(`LD A, (0xFF00 + C)`);
};

//LDH A, (n): Load accumulator (direct 0xFF00+n)
export const LDHAn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const address = (0xff00 + n) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.setStepCycles(3);

  console.debug(`LDH A, (n)`);
};

//LDH (n), A: Load from accumulator (direct 0xFF00+n)
export const LDHnA = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const address = (0xff00 + n) & 0xffff;
  const registerA = cpu.getRegister(7 /* A */);

  cpu.mmu.writeByte(address, registerA);
  cpu.setStepCycles(3);

  console.debug(`LDH (n), A`);
};

//LD A, (HL-)
export const LDAHLd = (cpu: CPU) => {
  const hlValue = cpu.mmu.readByte(cpu.getHL());
  cpu.setRegister(7 /* A */, hlValue);

  const decrementedHL = (cpu.getHL() - 1) & 0xffff;
  cpu.setHL(decrementedHL);

  cpu.setStepCycles(2);

  console.debug(`LD A, (HL-)`);
};

// LD (HL-), A
export const LDHLdA = (cpu: CPU) => {
  const aValue = cpu.getRegister(7 /* A */);
  cpu.mmu.writeByte(cpu.getHL(), aValue);

  const decrementedHL = (cpu.getHL() - 1) & 0xffff;
  cpu.setHL(decrementedHL);

  cpu.setStepCycles(2);

  console.debug(`LD (HL-), A`);
};

//LD A, (HL+)
export const LDAHLi = (cpu: CPU) => {
  const hlValue = cpu.mmu.readByte(cpu.getHL());
  cpu.setRegister(7 /* A */, hlValue);

  const incrementedHL = (cpu.getHL() + 1) & 0xffff;
  cpu.setHL(incrementedHL);

  cpu.setStepCycles(2);

  console.debug(`LD A, (HL+)`);
};

//LD (HL+), A
export const LDHLiA = (cpu: CPU) => {
  const aValue = cpu.getRegister(7 /* A */);
  cpu.mmu.writeByte(cpu.getHL(), aValue);

  const incrementedHL = (cpu.getHL() + 1) & 0xffff;
  cpu.setHL(incrementedHL);

  cpu.setStepCycles(2);

  console.debug(`LD (HL+), A`);
};

//LD rr, nn
//0b00xx0001/various
export const LDrrnn = (opcode: number, cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const register16bAddr = (opcode >> 4) & 0b11;
  const value = (nnMsb << 8) | nnLsb;

  cpu.set16BitRegister(register16bAddr, value);
  cpu.setStepCycles(3);

  console.debug(`LD rr nn`);
};

//LD (nn), SP
export const LDnnSP = (cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const address = ((nnMsb << 8) | nnLsb) & 0xffff;

  cpu.mmu.writeByte(address, cpu.lsb(cpu.SP));
  cpu.mmu.writeByte((address + 1) & 0xffff, cpu.msb(cpu.SP));
  cpu.setStepCycles(5);

  console.debug(`LD (nn), SP -> (nn) = ${address.toString(16)}`);
};

//LD SP, HL
export const LDSPHL = (cpu: CPU) => {
  cpu.SP = cpu.getHL();
  cpu.setStepCycles(2);

  console.debug(`LD SP, HL -> SP = ${cpu.SP.toString(16)}`);
};

//PUSH rr
//0b11xx0101/various
export const PUSHrr = (opcode: number, cpu: CPU) => {
  cpu.SP--;

  const register16bAddr = (opcode >> 4) & 0b11;
  const register16b = cpu.get16BitRegister(register16bAddr);

  cpu.mmu.writeByte(cpu.SP, cpu.msb(register16b));
  cpu.SP--;
  cpu.mmu.writeByte(cpu.SP, cpu.lsb(register16b));
  cpu.setStepCycles(4);

  console.debug(
    `PUSH ${
      ["BC", "DE", "HL", "AF"][register16bAddr]
    } -> SP = ${cpu.SP.toString(16)}`
  );
};

// POP rr
//0b11xx0001/various
export const POPrr = (opcode: number, cpu: CPU) => {
  const register16bAddr = (opcode >> 4) & 0b11;

  const lsb = cpu.mmu.readByte(cpu.SP);
  cpu.SP++;

  const msb = cpu.mmu.readByte(cpu.SP);
  cpu.SP++;

  const value = (msb << 8) | lsb;

  cpu.set16BitRegister(register16bAddr, value);
  cpu.setStepCycles(3);

  console.debug(
    `POP ${["BC", "DE", "HL", "AF"][register16bAddr]} -> SP = ${cpu.SP.toString(
      16
    )}`
  );
};

//LD HL, SP+e
export const LDHLSPe = (cpu: CPU) => {
  const e = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const signedE = toSigned8(e);
  const result = cpu.SP + signedE;

  cpu.setHL(result & 0xffff);

  const lowSP = cpu.lsb(cpu.SP);

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(lowSP, signedE & 0x0ff) ? 1 : 0;
  cpu.flags.C = checkCarry8(lowSP, signedE & 0x0ff) ? 1 : 0;

  cpu.setStepCycles(3);

  console.debug(
    `LD HL, SP+e -> HL=${cpu.getHL().toString(16)} H=${cpu.flags.H} C=${
      cpu.flags.C
    }`
  );
};

//ADD r: Add (register)
export const ADDr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A + B;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(A, B) ? 1 : 0;
  cpu.flags.C = checkCarry8(A, B) ? 1 : 0;

  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//ADD n: Add (immediate)
export const ADDn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A + n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(A, n) ? 1 : 0;
  cpu.flags.C = checkCarry8(A, n) ? 1 : 0;

  cpu.setStepCycles(2);
};

//ADC r: Add with carry (register)
export const ADCr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A + B + cpu.flags.C;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(A, B) ? 1 : 0;
  cpu.flags.C = checkCarry8(A, B) ? 1 : 0;

  //ADC (HL): Add with carry (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//ADC n: Add with carry (immediate)
export const ADCn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A + n + cpu.flags.C;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(A, n) ? 1 : 0;
  cpu.flags.C = checkCarry8(A, n) ? 1 : 0;

  cpu.setStepCycles(2);
};

//SUB r: Subtract (register)
export const SUBr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A - B;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, B) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, B) ? 1 : 0;

  //SUB (HL): Subtract (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//SUB n: Subtract (immediate)
export const SUBn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A - n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, n) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, n) ? 1 : 0;

  cpu.setStepCycles(2);
};

//SBC r: Subtract with carry (register)
export const SBCr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);
  const carry = cpu.flags.C;

  const result = A - B - carry;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, B, carry) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, B, carry) ? 1 : 0;

  //SBC (HL): Subtract with carry (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//SBC n: Subtract with carry (immediate)
export const SBCn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const carry = cpu.flags.C;

  const result = A - n - carry;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, n, carry) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, n, carry) ? 1 : 0;

  cpu.setStepCycles(2);
};

//CP r: Compare (register)
export const CPr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A - B;

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, B) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, B) ? 1 : 0;

  //CP (HL): Compare (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//CP n: Compare (immediate)
export const CPn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A - n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(A, n) ? 1 : 0;
  cpu.flags.C = checkBorrow8(A, n) ? 1 : 0;

  cpu.setStepCycles(2);
};

//INC r: Increment (register)
export const INCr = (opcode: number, cpu: CPU) => {
  const address = (opcode >> 3) & 0b111;

  const B = cpu.getRegister(address);
  const result = B + 1;

  cpu.setRegister(address, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(B, 1) ? 1 : 0;

  //INC (HL): Increment (indirect HL)
  const isHL = address === 0b110;

  cpu.setStepCycles(isHL ? 3 : 1);
};

//DEC r: Decrement (register)
export const DECr = (opcode: number, cpu: CPU) => {
  const address = (opcode >> 3) & 0b111;

  const B = cpu.getRegister(address);
  const result = B - 1;

  cpu.setRegister(address, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 1;
  cpu.flags.H = checkHalfBorrow8(B, 1) ? 1 : 0;

  //DEC (HL): Decrement (indirect HL)
  const isHL = address === 0b110;

  cpu.setStepCycles(isHL ? 3 : 1);
};

//AND r: Bitwise AND (register)
export const ANDr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A & B;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 1;
  cpu.flags.C = 0;

  //AND (HL): Bitwise AND (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//AND n: Bitwise AND (immediate)
export const ANDn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A & n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 1;
  cpu.flags.C = 0;

  cpu.setStepCycles(2);
};

//OR r: Bitwise OR (register)
export const ORr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A | B;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = 0;

  //OR (HL): Bitwise OR (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//OR n: Bitwise OR (immediate)
export const ORn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A | n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = 0;

  cpu.setStepCycles(2);
};

//XOR r: Bitwise XOR (register)
export const XORr = (opcode: number, cpu: CPU) => {
  const r = (opcode >> 5) & 0b111;

  const A = cpu.getRegister(7 /* A */);
  const B = cpu.getRegister(r);

  const result = A ^ B;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = 0;

  //XOR (HL): Bitwise XOR (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 2 : 1);
};

//XOR n: Bitwise XOR (immediate)
export const XORn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.PC++;

  const A = cpu.getRegister(7 /* A */);
  const result = A ^ n;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = (result & 0xff) === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = 0;

  cpu.setStepCycles(2);
};

//CCF: Complement carry flag
export const CCF = (cpu: CPU) => {
  cpu.flags.C = ~cpu.flags.C;
  cpu.flags.N = 0;
  cpu.flags.H = 0;

  cpu.setStepCycles(1);
};

//SCF: Set carry flag
export const SCF = (cpu: CPU) => {
  cpu.flags.C = 1;
  cpu.flags.N = 0;
  cpu.flags.H = 0;

  cpu.setStepCycles(1);
};

//DAA: Decimal adjust accumulator
export const DAA = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const isNegative = cpu.flags.N === 1;
  const isHalfCarry = cpu.flags.H === 1;
  const isCarry = cpu.flags.C === 1;

  let adjustment = 0;

  if (isNegative) {
    if (isHalfCarry) adjustment -= 0x06;
    if (isCarry) adjustment -= 0x60;
  } else {
    if (isHalfCarry || (A & 0x0f) > 0x09) adjustment += 0x06;
    if (isCarry || A > 0x99) {
      adjustment += 0x60;
      cpu.flags.C = 1;
    }
  }

  const result = (A + adjustment) & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = result === 0 ? 1 : 0;
  cpu.flags.H = 0;

  cpu.setStepCycles(1);
};

//CPL: Complement accumulator
export const CPL = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const result = ~A & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.N = 1;
  cpu.flags.H = 1;

  cpu.setStepCycles(1);
};

//INC rr: Increment 16-bit register
export const INCrr = (opcode: number, cpu: CPU) => {
  const rr = (opcode >> 4) & 0b11;

  const value = cpu.get16BitRegister(rr);
  cpu.set16BitRegister(rr, value + 1);

  cpu.setStepCycles(2);
};

//DEC rr: Decrement 16-bit register
export const DECrr = (opcode: number, cpu: CPU) => {
  const rr = (opcode >> 4) & 0b11;

  const value = cpu.get16BitRegister(rr);
  cpu.set16BitRegister(rr, value - 1);

  cpu.setStepCycles(2);
};

//ADD HL, rr: Add (16-bit register)
export const ADDHLrr = (opcode: number, cpu: CPU) => {
  const rr = (opcode >> 4) & 0b11;

  const HL = cpu.getHL();
  const value = cpu.get16BitRegister(rr);

  const result = (HL + value) & 0xffff;

  cpu.setHL(result);

  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry16(HL, value) ? 1 : 0;
  cpu.flags.C = checkCarry16(HL, value) ? 1 : 0;

  cpu.setStepCycles(2);
};

//ADD SP, e: Add to stack pointer (relative)
export const ADDSPe = (cpu: CPU) => {
  const e = toSigned8(cpu.mmu.readByte(cpu.PC));
  cpu.PC++;

  const SP = cpu.SP;
  const result = (SP + e) & 0xffff;

  cpu.SP = result;

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = checkHalfCarry8(SP, e) ? 1 : 0;
  cpu.flags.C = checkCarry8(SP, e) ? 1 : 0;

  cpu.setStepCycles(4);
};

//RLCA: Rotate left circular (accumulator)
export const RLCA = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const b7 = (A & 0b10000000) >> 7;

  const result = ((A << 1) | b7) & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b7;

  cpu.setStepCycles(1);
};

//RRCA: Rotate right circular (accumulator)
export const RRCA = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const b0 = A & 0b00000001;

  const result = ((A >> 1) | (b0 << 7)) & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b0;

  cpu.setStepCycles(1);
};

//RLA: Rotate left (accumulator)
export const RLA = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const b7 = (A & 0b10000000) >> 7;

  const result = ((A << 1) | cpu.flags.C) & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b7;

  cpu.setStepCycles(1);
};

//RRA: Rotate right (accumulator)
export const RRA = (cpu: CPU) => {
  const A = cpu.getRegister(7 /* A */);
  const b0 = A & 0b00000001;

  const result = ((cpu.flags.C << 7) | (A >> 1)) & 0xff;

  cpu.setRegister(7 /* A */, result);

  cpu.flags.Z = 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b0;

  cpu.setStepCycles(1);
};

//RLC r: Rotate left circular (register)
export const RLCr = (opcode: number, cpu: CPU) => {
  const r = opcode & 0b111;

  const value = cpu.getRegister(r);
  const b7 = (value & 0b10000000) >> 7;

  const result = ((value << 1) | b7) & 0xff;

  cpu.setRegister(r, result);

  cpu.flags.Z = result === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b7;

  //RLC (HL): Rotate left circular (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 4 : 2);
};

//RRC r: Rotate right circular (register)
export const RRCr = (opcode: number, cpu: CPU) => {
  const r = opcode & 0b111;

  const value = cpu.getRegister(r);
  const b0 = value & 0b00000001;

  const result = ((b0 << 7) | (value >> 1)) & 0xff;

  cpu.setRegister(r, result);

  cpu.flags.Z = result === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b0;

  //RRC (HL): Rotate right circular (indirect HL)
  const isHL = r === 0b110;

  cpu.setStepCycles(isHL ? 4 : 2);
};

export const RLr = (opcode: number, cpu: CPU) => {
  const r = opcode & 0b111;

  const value = cpu.getRegister(r);
  const b7 = (value & 0b10000000) >> 7;

  const result = (value << 1) | b7 && 0xff;

  cpu.flags.Z = result === 0 ? 1 : 0;
  cpu.flags.N = 0;
  cpu.flags.H = 0;
  cpu.flags.C = b7;
};
