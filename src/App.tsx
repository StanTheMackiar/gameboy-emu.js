import { useEffect, useRef, useState } from "react";
import { GameBoyEmulator } from "./emu/gameboy";

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [romSelected, setRomSelected] = useState<File | null>(null);

  const emu = useRef<GameBoyEmulator | null>(null);

  useEffect(function startEmu() {
    emu.current = new GameBoyEmulator(canvas.current!);

    if (!canvas.current) return;

    emu.current.start();

    return () => {
      emu.current?.stop();
    };
  }, []);

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!emu.current) return;

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
        <h6 className="text-right">By: StanTheMackiar</h6>
      </header>

      <main>
        <section className="flex flex-row justify-center items-center gap-2 mb-4">
          <input
            onChange={onChangeFile}
            hidden
            ref={fileInput}
            type="file"
            id="romInput"
            accept=".gb"
          />

          <button onClick={() => fileInput.current?.click()} id="loadBtn">
            Load ROM
          </button>

          <button onClick={() => emu.current?.stop()} id="resetBtn">
            Stop
          </button>
        </section>

        <section className="flex gap-1.5 items-center mb-4">
          {romSelected ? (
            <p>
              <strong>ROM selected:</strong> {romSelected.name}
            </p>
          ) : (
            <p>No ROM selected</p>
          )}
        </section>

        <canvas ref={canvas} />
      </main>
    </>
  );
}

export default App;
