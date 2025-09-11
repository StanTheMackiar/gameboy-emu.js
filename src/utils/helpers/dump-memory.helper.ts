export function dumpMemory(
  memory: Uint8Array,
  start: number = 0,
  end: number = memory.length,
  bytesPerRow: number = 16
) {
  let output = "";

  for (let addr = start; addr < end; addr += bytesPerRow) {
    const rowBytes = memory.slice(addr, addr + bytesPerRow);
    const hexAddr = addr.toString(16).padStart(4, "0");

    const hexValues = Array.from(rowBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");

    output += `${hexAddr}: ${hexValues}\n`;
  }

  console.log(output);
}
