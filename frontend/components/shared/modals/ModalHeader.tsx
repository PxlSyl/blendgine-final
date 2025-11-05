import React from 'react';
import { CrossIcon } from '@/components/icons';
import { DragControls } from 'framer-motion';

export interface ModalHeaderProps {
  onClose: () => void;
  dragControls: DragControls;
  title: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  onClose,
  dragControls,
  title,
  icon,
  iconColor = 'text-[rgb(var(--color-secondary))]',
}) => (
  <div
    className="cursor-move flex justify-between items-center p-2"
    onPointerDown={(e) => {
      e.stopPropagation();
      dragControls.start(e);
    }}
  >
    <div className="font-bold leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
      {icon && <div className={iconColor}>{icon}</div>}
      {title}
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="rounded-full p-1 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
    >
      <CrossIcon className="w-5 h-5" />
    </button>
  </div>
);
