/**
 * Convert unsigned 8-bit value (0..255) to signed (-128..127)
 */
export const toSigned8 = (n: number): number => {
  return (n << 24) >> 24; // fuerza signo a int32
};

/**
 * Convert unsigned 16-bit value (0..65535) to signed (-32768..32767)
 */
export const toSigned16 = (n: number): number => {
  return (n << 16) >> 16; // fuerza signo a int32
};
