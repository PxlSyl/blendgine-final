export function getDefaultFactors(algorithm: string): number[] {
  switch (algorithm) {
    case 'floydsteinberg':
      return [7 / 16, 3 / 16, 5 / 16, 1 / 16];
    case 'jarvisjudiceninke':
      return [
        7 / 48,
        5 / 48,
        3 / 48,
        5 / 48,
        7 / 48,
        5 / 48,
        3 / 48,
        1 / 48,
        3 / 48,
        5 / 48,
        3 / 48,
        1 / 48,
      ];
    case 'atkinson':
      return [1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8];
    case 'burke':
      return [8 / 32, 4 / 32, 2 / 32, 4 / 32, 8 / 32, 4 / 32, 2 / 32];
    case 'sierra':
      return [5 / 32, 3 / 32, 2 / 32, 4 / 32, 5 / 32, 4 / 32, 2 / 32, 2 / 32, 3 / 32, 2 / 32];
    case 'sierra2':
      return [0.4375, 0.1875, 0.3125, 0.0625];
    case 'sierralite':
      return [0.5, 0.25, 0.25];
    case 'stevensonarce':
      return [
        32 / 200,
        12 / 200,
        26 / 200,
        30 / 200,
        16 / 200,
        12 / 200,
        26 / 200,
        12 / 200,
        5 / 200,
        12 / 200,
        26 / 200,
        12 / 200,
      ];
    case 'stucki':
      return [
        8 / 42,
        4 / 42,
        2 / 42,
        4 / 42,
        8 / 42,
        4 / 42,
        2 / 42,
        1 / 42,
        2 / 42,
        4 / 42,
        2 / 42,
        1 / 42,
      ];
    default:
      return [7 / 16, 3 / 16, 5 / 16, 1 / 16];
  }
}

export function getGridCols(algorithm: string): string {
  switch (algorithm) {
    case 'floydsteinberg':
      return 'grid-cols-4';
    case 'jarvisjudiceninke':
      return 'grid-cols-6';
    case 'atkinson':
      return 'grid-cols-6';
    case 'burke':
      return 'grid-cols-7';
    case 'sierra':
      return 'grid-cols-5';
    case 'sierra2':
      return 'grid-cols-4';
    case 'sierralite':
      return 'grid-cols-3';
    case 'stevensonarce':
      return 'grid-cols-6';
    case 'stucki':
      return 'grid-cols-6';
    default:
      return 'grid-cols-4';
  }
}

export function getFactorLabel(algorithm: string, index: number): string {
  switch (algorithm) {
    case 'floydsteinberg': {
      const floydLabels = ['Right', 'Bottom-Left', 'Bottom', 'Bottom-Right'];
      return floydLabels[index] || `F${index + 1}`;
    }
    case 'jarvisjudiceninke': {
      const jjnLabels = [
        'R1',
        'R2',
        'BL1',
        'BL2',
        'B1',
        'BR1',
        'BR2',
        'B2L1',
        'B2L2',
        'B2',
        'B2R1',
        'B2R2',
      ];
      return jjnLabels[index] || `JJN${index + 1}`;
    }
    case 'atkinson': {
      const atkinsonLabels = ['R1', 'R2', 'BL', 'B', 'BR', 'B2'];
      return atkinsonLabels[index] || `A${index + 1}`;
    }
    case 'burke': {
      const burkeLabels = ['R1', 'R2', 'BL1', 'BL2', 'BR1', 'BR2', 'B'];
      return burkeLabels[index] || `B${index + 1}`;
    }
    case 'sierra': {
      const sierraLabels = ['R1', 'R2', 'BL1', 'BL2', 'B1', 'BR1', 'BR2', 'B2L', 'B2', 'B2R'];
      return sierraLabels[index] || `S${index + 1}`;
    }
    case 'sierra2': {
      const sierra2Labels = ['R1', 'R2', 'BL1', 'BL2', 'B1', 'BR1', 'BR2'];
      return sierra2Labels[index] || `S2${index + 1}`;
    }
    case 'sierralite': {
      const sierraLiteLabels = ['R', 'BL', 'B'];
      return sierraLiteLabels[index] || `SL${index + 1}`;
    }
    case 'stevensonarce': {
      const stevensonArceLabels = [
        'R1',
        'R2',
        'BL1',
        'BL2',
        'BL3',
        'B1',
        'BR1',
        'BR2',
        'BR3',
        'B2L',
        'B2',
        'B2R',
      ];
      return stevensonArceLabels[index] || `SA${index + 1}`;
    }
    case 'stucki': {
      const stuckiLabels = [
        'R1',
        'R2',
        'BL1',
        'BL2',
        'B1',
        'BR1',
        'BR2',
        'B2L1',
        'B2L2',
        'B2',
        'B2R1',
        'B2R2',
      ];
      return stuckiLabels[index] || `ST${index + 1}`;
    }
    default:
      return `F${index + 1}`;
  }
}
