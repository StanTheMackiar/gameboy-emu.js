export class BootROMControl {
  BOOT_ROM_FILE = "/roms/bootrom.gb";

  private enabled = true;
  private bootRom = new Uint8Array(0x100); // 256 bytes

  constructor() {
    this.loadBootRom(this.BOOT_ROM_FILE);
  }

  public async loadBootRom(url: string) {
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Failed to load Boot ROM from ${url}`);
    }

    const buffer = await resp.arrayBuffer();
    this.bootRom = new Uint8Array(buffer);
  }

  public isEnabled() {
    return this.enabled;
  }

  public reset() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  public readByte(addr: number): number {
    if (!this.enabled) throw new Error("Boot ROM disabled");
    // retorna el byte de la Boot ROM en la dirección dada (0x0000-0x00FF)

    return this.bootRom[addr];
  }
}
