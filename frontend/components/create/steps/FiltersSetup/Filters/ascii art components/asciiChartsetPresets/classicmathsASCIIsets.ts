import { AsciiCharsetPreset } from './type';

export const CLASSIC_MATH_ASCII: AsciiCharsetPreset[] = [
  {
    name: 'All Digits',
    charset: '9876543210:. ',
    font: 'NotoSansMono',
  },
  {
    name: 'Binary',
    charset: '10 ',
    font: 'NotoSansMono',
  },
  {
    name: 'Math Symbols',
    charset: '+-=*/^%~ ',
    font: 'NotoSansMono',
  },
  {
    name: 'Fractions',
    charset: '½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞ ',
    font: 'Symbola',
  },
  {
    name: 'Roman Numerals',
    charset: 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ ',
    font: 'Symbola',
  },
];
