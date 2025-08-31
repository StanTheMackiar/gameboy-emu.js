import { useEffect, useRef } from "react";
import { GameBoyEmulator } from "./utils/helpers/run-emu.helper";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const emu = new GameBoyEmulator(canvas.current!);

    emu.start();
  }, []);

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl text-left font-bold">Gameboy emulator</h1>
        <h6>By: StanTheMackiar</h6>
      </header>

      <canvas ref={canvas}></canvas>
    </>
  );
}

export default App;
