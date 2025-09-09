import { useEffect, useRef, useState } from "react";
import { GameBoyEmulator } from "./emu/gameboy";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [romSelected, setRomSelected] = useState<File | null>(null);

  const emu = useRef<GameBoyEmulator>(new GameBoyEmulator(canvas.current!));

  useEffect(function startEmu() {
    emu.current.start();
  }, []);

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileNamesAccepted = [".gb"];

    if (!fileNamesAccepted.some((ext) => file.name.endsWith(ext))) {
      alert("Formato inválido. Solo se permiten archivos .gb");
      setRomSelected(null);
      return;
    }

    setRomSelected(file);
    const arrayBuffer = await file.arrayBuffer();
    const romData = new Uint8Array(arrayBuffer);

    emu.current.loadRom(romData);
  };

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl text-left font-bold">Gameboy emulator</h1>
        <h6>By: StanTheMackiar</h6>
      </header>

      <main>
        <section className="flex flex-row items-center gap-2 mb-4">
          <input
            value={romSelected?.name || ""}
            onChange={onChangeFile}
            hidden
            type="file"
            id="romInput"
            accept=".gb"
          />

          <button onClick={() => fileInput.current?.click()} id="loadBtn">
            Load ROM
          </button>
        </section>
        <canvas ref={canvas} />
      </main>
    </>
  );
}

export default App;
