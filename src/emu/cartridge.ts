export class Cartridge {
  private ROM_0 = new Uint8Array(0x4000); // 0x0000–0x3FFF
  private ROM_N = new Uint8Array(0x4000); // 0x4000–0x7FFF
  private EXTERNAL_RAM = new Uint8Array(0x2000); // 0xA000–0xBFFF

  constructor() {}

  public loadRom(romData: Uint8Array) {
    this.ROM_0.set(romData.slice(0, 0x4000));
    this.ROM_N.set(romData.slice(0x4000, 0x8000));
  }

  getByte(address: number): number {
    if (address < 0x4000) return this.ROM_0[address];
    if (address < 0x8000) return this.ROM_N[address - 0x4000];
    return 0xff;
  }
}
