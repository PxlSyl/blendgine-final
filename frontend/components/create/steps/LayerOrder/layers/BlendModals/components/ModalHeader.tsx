import React from 'react';
import { CrossIcon, MixIcon } from '@/components/icons';
import { DragControls } from 'framer-motion';

export const ModalHeader: React.FC<{
  onClose: () => void;
  dragControls: DragControls;
  text: string;
}> = ({ onClose, dragControls, text }) => (
  <div
    className="cursor-move border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
    onPointerDown={(e) => {
      e.stopPropagation();
      dragControls.start(e);
    }}
  >
    <div
      className={`text-sm font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2`}
    >
      <MixIcon className="w-4 h-4 text-[rgb(var(--color-secondary))]" />
      {text}
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="rounded-full p-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      <CrossIcon className="w-5 h-5" />
    </button>
  </div>
);
