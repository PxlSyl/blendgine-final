import React from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onRemove?: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onRemove }) => {
  return (
    <div className="w-12 h-8 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-14 h-10 -m-1 cursor-pointer"
      />
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-[rgb(var(--color-quaternary))] hover:text-[rgb(var(--color-quaternary-dark))]"
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default ColorPicker;
