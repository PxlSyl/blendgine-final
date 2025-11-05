import React from 'react';

export interface ModalFooterProps {
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  closeText?: string;
  confirmDisabled?: boolean;
  showConfirm?: boolean;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  onClose,
  onConfirm,
  confirmText = 'Apply',
  closeText = 'Close',
  confirmDisabled = false,
  showConfirm = true,
  className = '',
}) => (
  <div className={`pt-3 flex justify-between gap-2 p-2 ${className}`}>
    {showConfirm && onConfirm ? (
      <>
        <button
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`flex-1 px-4 py-2 rounded-sm transition-colors duration-200 ${
            confirmDisabled
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 cursor-not-allowed'
              : 'bg-[rgb(var(--color-accent))] dark:bg-[rgb(var(--color-accent-dark))] text-white hover:bg-[rgb(var(--color-accent-dark))] dark:hover:bg-[rgb(var(--color-accent))] cursor-pointer'
          }`}
        >
          {confirmText}
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
        >
          {closeText}
        </button>
      </>
    ) : (
      <div className="flex justify-end w-full">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
        >
          {closeText}
        </button>
      </div>
    )}
  </div>
);
