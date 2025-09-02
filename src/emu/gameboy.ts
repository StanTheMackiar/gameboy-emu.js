import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import type { EmulatorConfig } from "../utils/interfaces/emu-config.interface";
import { Cartridge } from "./cartridge";
import { CPU } from "./cpu";
import { APU } from "./io/apu";
import { Joypad } from "./io/joypad";
import { Serial } from "./io/serial";
import { Timer } from "./io/timer";
import { MMU } from "./mmu";
import { PPU } from "./ppu";
import { RAM } from "./ram";

export class GameBoyEmulator {
  private rom: Cartridge;
  private mmu: MMU;
  private ram: RAM;
  private ppu: PPU;
  private cpu: CPU;
  private apu: APU;
  private timer: Timer;
  private serial: Serial;
  private joypad: Joypad;

  config: EmulatorConfig = {
    TIMER_HZ: 60,
    STEPS_BY_FRAME: 10,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.rom = new Cartridge();
    this.ppu = new PPU(canvas);
    this.apu = new APU();
    this.ram = new RAM();
    this.timer = new Timer();
    this.serial = new Serial();
    this.joypad = new Joypad();

    this.mmu = new MMU(
      this.rom,
      this.ppu,
      this.apu,
      this.ram,
      this.timer,
      this.serial,
      this.joypad
    );

    this.cpu = new CPU(this.mmu);
  }

  private loop() {
    if (this.cpu.status !== CPUStatusEnum.RUNNING) {
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    for (let i = 0; i < this.config.STEPS_BY_FRAME; i++) {
      const { status } = this.cpu.step();
      if (status !== CPUStatusEnum.RUNNING) break;
    }

    this.ppu.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  public start() {
    this.loop();
  }
}
