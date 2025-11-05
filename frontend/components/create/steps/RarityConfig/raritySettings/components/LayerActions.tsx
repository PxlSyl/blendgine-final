import React from 'react';

interface LayerActionsProps {
  layer: string;
  isLayerLocked: boolean;
  equalizeRarity: (layer: string) => void;
  randomizeLayer: (layer: string) => void;
  resetLayerRarity: (layer: string) => void;
}

export const LayerActions: React.FC<LayerActionsProps> = ({
  layer,
  isLayerLocked,
  equalizeRarity,
  randomizeLayer,
  resetLayerRarity,
}) => {
  const buttonClasses = `
    flex-1 px-2 py-1 text-xs sm:text-sm text-white rounded-sm
    disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer
  `;

  const buttonVariants = {
    equalize: 'bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-dark))]',
    randomize: 'bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-secondary-dark))]',
    reset: 'bg-[rgb(var(--color-secondary-dark))] hover:bg-[rgb(var(--color-secondary))]',
  };

  return (
    <div className="flex items-center mb-2">
      <div className="grid grid-cols-3 gap-1 w-full">
        <button
          onClick={() => equalizeRarity(layer)}
          className={`${buttonClasses} ${buttonVariants.equalize}`}
          disabled={isLayerLocked}
        >
          Equalize
        </button>
        <button
          onClick={() => randomizeLayer(layer)}
          className={`${buttonClasses} ${buttonVariants.randomize}`}
          disabled={isLayerLocked}
        >
          Randomize
        </button>
        <button
          onClick={() => resetLayerRarity(layer)}
          className={`${buttonClasses} ${buttonVariants.reset}`}
          disabled={isLayerLocked}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
