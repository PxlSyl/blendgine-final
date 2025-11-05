interface ZoomButtonProps {
  label: string;
  onClick: () => void;
  color: 'blue' | 'red' | 'pink';
  isSquare?: boolean;
}

export const ZoomButton: React.FC<ZoomButtonProps> = ({
  label,
  onClick,
  color,
  isSquare = false,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-gradient-to-b from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))]';
      case 'red':
        return 'bg-gradient-to-b from-[rgb(var(--color-quaternary))] to-[rgb(var(--color-quaternary-dark))]';
      case 'pink':
        return 'bg-gradient-to-b from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))]';
      default:
        return 'bg-gradient-to-b from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))]';
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case 'blue':
        return '1px solid rgb(var(--color-accent))';
      case 'red':
        return '1px solid rgb(var(--color-quaternary))';
      case 'pink':
        return '1px solid rgb(var(--color-secondary))';
      default:
        return '1px solid rgb(var(--color-accent))';
    }
  };

  return (
    <div
      className={`flex items-center rounded-sm overflow-hidden ${getColorClasses()}`}
      style={{
        boxShadow:
          'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
        border: getBorderColor(),
        height: '32px',
      }}
    >
      <button
        onClick={onClick}
        className={`text-sm font-medium flex items-center justify-center text-white h-8 leading-none cursor-pointer ${
          isSquare ? 'w-8' : 'px-3'
        }`}
        style={{
          textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
        }}
      >
        {label}
      </button>
    </div>
  );
};
