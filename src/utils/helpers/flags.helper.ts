/**
 * Carry (8-bit)
 * True si el resultado excede 0xFF (overflow del bit 7 al 8)
 */
export const checkCarry8 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0xff) + (b & 0xff) + carry > 0xff;
};

/**
 * Borrow (8-bit)
 * True si el resultado es menor que 0 (underflow del bit 7 al 8)
 */
export const checkBorrow8 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0xff) - (b & 0xff) - carry < 0;
};

/**
 * Half Carry (8-bit)
 * True si hay carry del bit 3 al bit 4
 */
export const checkHalfCarry8 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0x0f) + (b & 0x0f) + carry > 0x0f;
};

/**
 * Half Borrow (8-bit)
 * True si hay borrow del bit 4 al bit 3
 */
export const checkHalfBorrow8 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0x0f) - (b & 0x0f) - carry < 0;
};

/**
 * Carry (16-bit)
 * True si el resultado excede 0xFFFF (overflow del bit 15 al 16)
 */
export const checkCarry16 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0xffff) + (b & 0xffff) + carry > 0xffff;
};

/**
 * Borrow (16-bit)
 * True si el resultado es menor que 0 (underflow del bit 15 al 16)
 */
export const checkBorrow16 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0xffff) - (b & 0xffff) - carry < 0;
};

/**
 * Half Carry (16-bit)
 * True si hay carry del bit 11 al bit 12
 */
export const checkHalfCarry16 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0x0fff) + (b & 0x0fff) + carry > 0x0fff;
};

/**
 * Half Borrow (16-bit)
 * True si hay borrow del bit 12 al bit 11
 */
export const checkHalfBorrow16 = (
  a: number,
  b: number,
  carry: number = 0
): boolean => {
  return (a & 0x0fff) - (b & 0x0fff) - carry < 0;
};
