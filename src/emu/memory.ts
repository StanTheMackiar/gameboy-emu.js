export class Memory {
  MEMORY_SIZE = 1024 * 64;
  private memory: Uint8Array;

  constructor() {
    this.memory = new Uint8Array(this.MEMORY_SIZE); // 64KB of memory
  }

  readByte(address: number): number {
    return this.memory[address];
  }

  writeByte(address: number, value: number) {
    this.memory[address] = value;
  }

  reset() {
    this.memory.fill(0);
  }
}
