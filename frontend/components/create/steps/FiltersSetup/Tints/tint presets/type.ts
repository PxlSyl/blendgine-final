interface colorPalette {
  color: string;
  percentage: number;
  intensity: number;
}
export interface colorPalettePresets {
  name: string;
  colors: colorPalette[];
}
