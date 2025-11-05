export const generateRandomColor = (existingColors: string[]): string => {
  const letters = '0123456789ABCDEF';
  let color: string;
  do {
    color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
  } while (existingColors.includes(color));
  return color;
};
