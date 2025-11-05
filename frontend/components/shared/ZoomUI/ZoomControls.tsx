import { ZoomButton } from './ZoomButton';
interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomIn, onZoomOut }) => {
  return (
    <div className="flex items-center">
      <ZoomButton label="-" onClick={onZoomOut} color="blue" isSquare />
      <div
        className="flex items-center justify-center h-8 w-16 bg-gradient-to-b from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))] text-sm font-medium text-white"
        style={{
          boxShadow:
            'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
          border: '1px solid rgb(var(--color-accent))',
          textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
      <ZoomButton label="+" onClick={onZoomIn} color="blue" isSquare />
    </div>
  );
};
