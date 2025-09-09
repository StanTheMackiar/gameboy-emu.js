import { CPUStatusEnum } from "../utils/enum/cpu-status.enum";
import { Cartridge } from "./cartridge";
import { CPU } from "./cpu";
import { APU } from "./io/apu";
import { BootROMControl } from "./io/boot-rom";
import { Interrupts } from "./io/interrupts";
import { Joypad } from "./io/joypad";
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
  private interrupts: Interrupts;
  private joypad: Joypad;
  private bootRom: BootROMControl;

  FRAME_DURATION_MS = 1000 / 60;
  CYCLES_PER_FRAME = 70224;
  lastFrameAt = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.rom = new Cartridge();
    this.ppu = new PPU(canvas);
    this.apu = new APU();
    this.ram = new RAM();
    this.interrupts = new Interrupts();
    this.timer = new Timer(this.interrupts);
    this.joypad = new Joypad();
    this.bootRom = new BootROMControl();

    this.mmu = new MMU(
      this.rom,
      this.ppu,
      this.apu,
      this.ram,
      this.timer,
      this.interrupts,
      this.joypad,
      this.bootRom
    );

    this.cpu = new CPU(this.mmu);
  }

  private loop() {
    if (this.cpu.status !== CPUStatusEnum.RUNNING) {
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    let cyclesThisFrame = 0;

    const now = performance.now();
    const elapsed = now - this.lastFrameAt;

    if (elapsed < this.FRAME_DURATION_MS) {
      requestAnimationFrame(this.loop.bind(this));
      return;
    }

    while (cyclesThisFrame < this.CYCLES_PER_FRAME) {
      const { status, stepCycles } = this.cpu.step();
      if (status !== CPUStatusEnum.RUNNING) break;

      cyclesThisFrame += stepCycles;

      this.timer.tick(stepCycles);
      this.ppu.tick(stepCycles);

      const pendingInterrupt = this.mmu.interrupts.getPendingInterrupt();
      if (pendingInterrupt !== null) {
        this.cpu.handleInterrupt(pendingInterrupt);
      }
    }

    this.lastFrameAt += this.FRAME_DURATION_MS;

    this.ppu.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  public reset() {
    this.cpu.reset();
  }

  public stop() {
    this.cpu.stop();
  }

  public loadRom(romData: Uint8Array) {
    this.reset();
    this.rom.loadRom(romData);
  }

  public start() {
    this.loop();
  }
}
