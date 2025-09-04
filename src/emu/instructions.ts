import type { CPU } from "./cpu";

export const LDrn = (opcode: number, cpu: CPU) => {
  const reg = (opcode >> 3) & 0b111; // bits 3–5
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  cpu.incrementCycles(2);

  console.debug(`LD ${cpu.getRegisterName(reg)}, 0x${n.toString(16)}`);
};

export const LDHLn = (cpu: CPU) => {
  //Length 2: opcde + n
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  cpu.mmu.writeByte(cpu.getHL(), n);
  cpu.incrementCycles(3);

  console.debug(`LD (HL), 0x${n.toString(16)}`);
};

export const LDrr = (opcode: number, cpu: CPU) => {
  const src = opcode & 0b111; // bits 0–2
  const dest = (opcode >> 3) & 0b111; // bits 3–5

  const registerDest = cpu.getRegister(dest);

  if (src === 0b110) {
    // LD (HL), r
    cpu.mmu.writeByte(cpu.getHL(), registerDest);
    cpu.incrementCycles(2);

    console.debug(`LD (HL), ${cpu.getRegisterName(dest)}`);

    return;
  }

  if (dest === 0b110) {
    // LD r, (HL)
    cpu.setRegister(src, registerDest);
    cpu.incrementCycles(2);

    console.debug(`LD ${cpu.getRegisterName(src)}, (HL)`);

    return;
  }

  //LD r, r
  cpu.setRegister(src, registerDest);
  cpu.incrementCycles(1);

  console.debug(`LD ${cpu.getRegisterName(src)}, ${cpu.getRegisterName(dest)}`);
};

export const LDABC = (cpu: CPU) => {
  const BC = (cpu.registers.B << 8) | cpu.registers.C;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(BC));
  cpu.incrementCycles(2);

  console.debug(`LD A, (BC)`);
};

export const LDADE = (cpu: CPU) => {
  const DE = (cpu.registers.D << 8) | cpu.registers.E;

  cpu.setRegister(7 /*A*/, cpu.mmu.readByte(DE));
  cpu.incrementCycles(2);

  console.debug(`LD A, (DE)`);
};

export const LDBCA = (cpu: CPU) => {
  const BC = (cpu.registers.B << 8) | cpu.registers.C;

  cpu.mmu.writeByte(BC, cpu.getRegister(7 /* A */));
  cpu.incrementCycles(2);

  console.debug(`LD (BC), A`);
};

export const LDDEA = (cpu: CPU) => {
  const DE = (cpu.registers.D << 8) | cpu.registers.E;

  cpu.mmu.writeByte(DE, cpu.getRegister(7 /* A */));
  cpu.incrementCycles(2);

  console.debug(`LD (DE), A`);
};

// LD A, (nn) - opcode 0xFA
export const LDAnn = (cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  const address = ((nnMsb << 8) | nnLsb) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.incrementCycles(4);

  console.debug(`LD A, (nn)`);
};

//LD (nn), A - opcode 0xEA
export const LDnnA = (cpu: CPU) => {
  const nnLsb = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();
  const nnMsb = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  const address = ((nnMsb << 8) | nnLsb) & 0xffff;

  const registerA = cpu.getRegister(7);
  cpu.mmu.writeByte(address, registerA);
  cpu.incrementCycles(4);

  console.debug(`LD (nn), A`);
};

// LD A, (0xFF00 + C) - opcode 0xF2
export const LDHAC = (cpu: CPU) => {
  const registerC = cpu.getRegister(1);
  const address = (0xff00 + registerC) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.incrementCycles(2);

  console.debug(`LD A, (0xFF00 + C)`);
};

export const LDHAn = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  const address = (0xff00 + n) & 0xffff;

  cpu.setRegister(7 /* A */, cpu.mmu.readByte(address));
  cpu.incrementCycles(3);

  console.debug(`LDH A, (n)`);
};

export const LDHnA = (cpu: CPU) => {
  const n = cpu.mmu.readByte(cpu.PC);
  cpu.incrementPC();

  const address = (0xff00 + n) & 0xffff;
  const registerA = cpu.getRegister(7 /* A */);

  cpu.mmu.writeByte(address, registerA);
  cpu.incrementCycles(3);

  console.debug(`LDH (n), A`);
};
