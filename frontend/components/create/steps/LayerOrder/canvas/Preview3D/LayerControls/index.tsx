import React, { useCallback } from 'react';

import { useLayerOrder } from '@/components/store/layerOrder/hook';
import { ZoomIcon, SpacingIcon, ThicknessIcon } from '@/components/icons';

import { createSliderStyles } from './components/sliderStyles';
import { SliderControl } from './components/SliderControl';
import { ControlGroup } from './components/ControlGroup';
import { Header } from './components/Header';

interface LayerControlsProps {
  onCameraSwitch: () => void;
  disabled?: boolean;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ onCameraSwitch, disabled }) => {
  const {
    perspectiveParams,
    orthographicParams,
    cameraType,
    setLayerSpacing,
    setLayerThickness,
    setZoom,
    resetToFlatView,
  } = useLayerOrder();

  const currentParams = cameraType === 'perspective' ? perspectiveParams : orthographicParams;

  const handleZoomButton = useCallback(
    (increment: boolean) => {
      const step = 0.1;
      const newValue = increment
        ? Math.min(currentParams.zoom + step, 9)
        : Math.max(currentParams.zoom - step, 0.5);
      setZoom(newValue, cameraType);
    },
    [currentParams.zoom, cameraType, setZoom]
  );

  const handleSpacingChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      setLayerSpacing(value, cameraType);
    },
    [cameraType, setLayerSpacing]
  );

  const handleThicknessChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      setLayerThickness(value, cameraType);
    },
    [cameraType, setLayerThickness]
  );

  const handleSpacingNumberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(parseFloat(event.target.value).toFixed(2));
      setLayerSpacing(value, cameraType);
    },
    [cameraType, setLayerSpacing]
  );

  const handleThicknessNumberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(parseFloat(event.target.value).toFixed(2));
      setLayerThickness(value, cameraType);
    },
    [cameraType, setLayerThickness]
  );

  const handleZoomChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      setZoom(value, cameraType);
    },
    [cameraType, setZoom]
  );

  const handleZoomNumberChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(parseFloat(event.target.value).toFixed(2));
      setZoom(value, cameraType);
    },
    [cameraType, setZoom]
  );

  const handleSpacingButton = useCallback(
    (increment: boolean) => {
      const step = 0.01;
      const newValue = increment
        ? Math.min(currentParams.layerSpacing + step, 0.5)
        : Math.max(currentParams.layerSpacing - step, 0.01);
      setLayerSpacing(newValue, cameraType);
    },
    [currentParams.layerSpacing, cameraType, setLayerSpacing]
  );

  const handleThicknessButton = useCallback(
    (increment: boolean) => {
      const step = 0.01;
      const newValue = increment
        ? Math.min(currentParams.layerThickness + step, 0.2)
        : Math.max(currentParams.layerThickness - step, 0.01);
      setLayerThickness(newValue, cameraType);
    },
    [currentParams.layerThickness, cameraType, setLayerThickness]
  );

  const spacingProgress = ((currentParams.layerSpacing - 0.01) / (0.5 - 0.01)) * 100;
  const thicknessProgress = ((currentParams.layerThickness - 0.001) / (0.2 - 0.001)) * 100;
  const zoomProgress = ((currentParams.zoom - 0.5) / (9 - 0.5)) * 100;

  return (
    <div className="relative">
      <div className="px-1 flex flex-col items-stretch min-w-[200px] w-full">
        <style>{createSliderStyles(spacingProgress, thicknessProgress, zoomProgress)}</style>
        <Header
          onCameraSwitch={onCameraSwitch}
          onResetView={resetToFlatView}
          disabled={disabled}
          cameraType={cameraType}
        />
        <div className="flex flex-col flex-1 min-w-0 bg-gray-100 dark:bg-gray-900 px-1 pt-1.5 pb-1">
          <ControlGroup
            icon={<ZoomIcon className="h-5 w-5" />}
            color="blue"
            tooltip="Zoom"
            onDecrease={() => handleZoomButton(false)}
            onIncrease={() => handleZoomButton(true)}
            disabled={disabled}
          >
            <SliderControl
              value={currentParams.zoom}
              onChange={handleZoomChange}
              onNumberChange={handleZoomNumberChange}
              min="0.5"
              max="9"
              step="0.1"
              disabled={disabled}
              color="blue"
              sliderClass="zoom-slider"
            />
          </ControlGroup>
          <ControlGroup
            icon={<SpacingIcon className="h-5 w-5" />}
            color="purple"
            tooltip="Spacing"
            onDecrease={() => handleSpacingButton(false)}
            onIncrease={() => handleSpacingButton(true)}
            disabled={disabled}
          >
            <SliderControl
              value={currentParams.layerSpacing}
              onChange={handleSpacingChange}
              onNumberChange={handleSpacingNumberChange}
              min="0.001"
              max="0.5"
              step="0.001"
              disabled={disabled}
              color="purple"
              sliderClass="spacing-slider"
              decimals={2}
            />
          </ControlGroup>
          <ControlGroup
            icon={<ThicknessIcon className="h-5 w-5" />}
            color="pink"
            tooltip="Thickness"
            onDecrease={() => handleThicknessButton(false)}
            onIncrease={() => handleThicknessButton(true)}
            disabled={disabled}
          >
            <SliderControl
              value={currentParams.layerThickness}
              onChange={handleThicknessChange}
              onNumberChange={handleThicknessNumberChange}
              min="0.001"
              max="0.2"
              step="0.001"
              disabled={disabled}
              color="pink"
              sliderClass="thickness-slider"
              decimals={2}
            />
          </ControlGroup>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LayerControls);
