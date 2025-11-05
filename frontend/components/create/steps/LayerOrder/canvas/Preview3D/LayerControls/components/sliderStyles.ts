export const createSliderStyles = (
  spacingProgress: number,
  thicknessProgress: number,
  zoomProgress: number
) => {
  return `
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      background: #D1D5DB;
      border-radius: 9999px;
      position: relative;
    }

    .dark input[type="range"] {
      background: #374151;
    }

    input[type="range"]::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 9999px;
    }

    input[type="range"]::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: #D1D5DB;
    }

    .dark input[type="range"]::-moz-range-track {
      background: #374151;
    }

    .spacing-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-primary)), rgb(var(--color-accent)) ${spacingProgress}%, 
        rgb(209 213 219) ${spacingProgress}%
      );
    }

    .dark .spacing-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-primary)), rgb(var(--color-accent)) ${spacingProgress}%, 
        rgb(55 65 81) ${spacingProgress}%
      );
    }

    .thickness-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-secondary)), rgb(var(--color-primary)) ${thicknessProgress}%, 
        rgb(209 213 219) ${thicknessProgress}%
      );
    }

    .dark .thickness-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-secondary)), rgb(var(--color-primary)) ${thicknessProgress}%, 
        rgb(55 65 81) ${thicknessProgress}%
      );
    }

    .zoom-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-accent)), rgb(var(--color-secondary)) ${zoomProgress}%, 
        rgb(209 213 219) ${zoomProgress}%
      );
    }

    .dark .zoom-slider::-webkit-slider-runnable-track {
      background: linear-gradient(to right, 
        rgb(var(--color-accent)), rgb(var(--color-secondary)) ${zoomProgress}%, 
        rgb(55 65 81) ${zoomProgress}%
      );
    }

    .spacing-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-primary));
      cursor: pointer;
      margin-top: -6px;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .spacing-slider::-webkit-slider-thumb {
      background: rgb(var(--color-primary-dark));
    }

    .spacing-slider::-moz-range-thumb {
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-primary));
      cursor: pointer;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .spacing-slider::-moz-range-thumb {
      background: rgb(var(--color-primary-dark));
    }

    .thickness-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-secondary));
      cursor: pointer;
      margin-top: -6px;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .thickness-slider::-webkit-slider-thumb {
      background: rgb(var(--color-secondary-dark));
    }

    .thickness-slider::-moz-range-thumb {
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-secondary));
      cursor: pointer;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .thickness-slider::-moz-range-thumb {
      background: rgb(var(--color-secondary-dark));
    }

    .zoom-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-accent));
      cursor: pointer;
      margin-top: -6px;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .zoom-slider::-webkit-slider-thumb {
      background: rgb(var(--color-accent-dark));
    }

    .zoom-slider::-moz-range-thumb {
      width: 6px;
      height: 18px;
      border: none;
      background: rgb(var(--color-accent));
      cursor: pointer;
      border-radius: 3px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }

    .dark .zoom-slider::-moz-range-thumb {
      background: rgb(var(--color-accent-dark));
    }

    .spacing-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-primary-light));
      transform: scaleX(1.5);
    }

    .dark .spacing-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-primary));
    }

    .spacing-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-primary-light));
      transform: scaleX(1.5);
    }

    .dark .spacing-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-primary));
    }

    .thickness-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-secondary-light));
      transform: scaleX(1.5);
    }

    .dark .thickness-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-secondary));
    }

    .thickness-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-secondary-light));
      transform: scaleX(1.5);
    }

    .dark .thickness-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-secondary));
    }

    .zoom-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-accent-light));
      transform: scaleX(1.5);
    }

    .dark .zoom-slider::-webkit-slider-thumb:hover {
      background: rgb(var(--color-accent));
    }

    .zoom-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-accent-light));
      transform: scaleX(1.5);
    }

    .dark .zoom-slider::-moz-range-thumb:hover {
      background: rgb(var(--color-accent));
    }

    .spacing-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-primary-dark));
      transform: scaleX(1.8);
    }

    .dark .spacing-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-primary-dark));
    }

    .spacing-slider::-moz-range-thumb:active {
      background: rgb(var(--color-primary-dark));
      transform: scaleX(1.8);
    }

    .dark .spacing-slider::-moz-range-thumb:active {
      background: rgb(var(--color-primary-dark));
    }

    .thickness-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-secondary-dark));
      transform: scaleX(1.8);
    }

    .dark .thickness-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-secondary-dark));
    }

    .thickness-slider::-moz-range-thumb:active {
      background: rgb(var(--color-secondary-dark));
      transform: scaleX(1.8);
    }

    .dark .thickness-slider::-moz-range-thumb:active {
      background: rgb(var(--color-secondary-dark));
    }

    .zoom-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-accent-dark));
      transform: scaleX(1.8);
    }

    .dark .zoom-slider::-webkit-slider-thumb:active {
      background: rgb(var(--color-accent-dark));
    }

    .zoom-slider::-moz-range-thumb:active {
      background: rgb(var(--color-accent-dark));
      transform: scaleX(1.8);
    }

    .dark .zoom-slider::-moz-range-thumb:active {
      background: rgb(var(--color-accent-dark));
    }

    .spacing-slider::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: linear-gradient(to right, 
        rgb(var(--color-primary)), rgb(var(--color-accent)) ${spacingProgress}%, 
        rgb(209 213 219) ${spacingProgress}%
      );
    }

    .dark .spacing-slider::-moz-range-track {
      background: linear-gradient(to right, 
        rgb(var(--color-primary)), rgb(var(--color-accent)) ${spacingProgress}%, 
        rgb(55 65 81) ${spacingProgress}%
      );
    }

    .thickness-slider::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: linear-gradient(to right, 
        rgb(var(--color-secondary)), rgb(var(--color-primary)) ${thicknessProgress}%, 
        rgb(209 213 219) ${thicknessProgress}%
      );
    }

    .dark .thickness-slider::-moz-range-track {
      background: linear-gradient(to right, 
        rgb(var(--color-secondary)), rgb(var(--color-primary)) ${thicknessProgress}%, 
        rgb(55 65 81) ${thicknessProgress}%
      );
    }

    .zoom-slider::-moz-range-track {
      height: 6px;
      border-radius: 9999px;
      background: linear-gradient(to right, 
        rgb(var(--color-accent)), rgb(var(--color-secondary)) ${zoomProgress}%, 
        rgb(209 213 219) ${zoomProgress}%
      );
    }

    .dark .zoom-slider::-moz-range-track {
      background: linear-gradient(to right, 
        rgb(var(--color-accent)), rgb(var(--color-secondary)) ${zoomProgress}%, 
        rgb(55 65 81) ${zoomProgress}%
      );
    }
  `;
};
