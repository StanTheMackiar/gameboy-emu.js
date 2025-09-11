//Mascara de bits para los tipos de interrupciones
export enum InterruptTypeEnum {
  VBLANK = 0b00000001, // bit 0
  LCD_STAT = 0b00000010, // bit 1
  TIMER = 0b00000100, // bit 2
  SERIAL = 0b00001000, // bit 3
  JOYPAD = 0b00010000, // bit 4
}
