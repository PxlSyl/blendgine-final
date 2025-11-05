import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useClickOutside } from '@/components/hooks/useClickOutside';
import { ModalHeader } from './ModalHeader';
import { ModalFooter, ModalFooterProps } from './ModalFooter';
import GradientBar from '@/components/shared/GradientBar';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  zIndex?: number;
  showFooter?: boolean;
  footerProps?: Partial<ModalFooterProps>;
  className?: string;
  contentClassName?: string;
  searchBar?: React.ReactNode;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  iconColor,
  children,
  width = 'w-[500px]',
  height = 'h-[550px]',
  zIndex = 9999,
  showFooter = true,
  footerProps = {},
  className = '',
  contentClassName = '',
  searchBar,
}) => {
  const dragControls = useDragControls();
  const modalRef = useClickOutside(() => {
    if (isOpen) {
      onClose();
    }
  });

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[${zIndex}] overflow-y-auto`}
        >
          <div className="flex min-h-full items-center justify-center p-2 text-sm text-center">
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`${width} ${height} transform rounded-sm bg-white dark:bg-gray-800 text-left align-middle shadow-xl border border-gray-300 dark:border-gray-700 relative flex flex-col overflow-hidden ${className}`}
              drag
              dragControls={dragControls}
              dragMomentum={false}
              style={{ touchAction: 'none' }}
            >
              <div className="flex flex-col h-full">
                <ModalHeader
                  onClose={onClose}
                  dragControls={dragControls}
                  title={title}
                  icon={icon}
                  iconColor={iconColor}
                />

                <GradientBar position="top" background="bg-white dark:bg-gray-800" />

                {searchBar && <div className="flex-shrink-0 px-2 pt-2">{searchBar}</div>}

                <div className={`flex-1 overflow-y-auto min-h-0 p-2 ${contentClassName}`}>
                  {children}
                </div>

                {showFooter && (
                  <div className="flex-shrink-0">
                    <ModalFooter onClose={onClose} {...footerProps} />
                  </div>
                )}

                <GradientBar position="bottom" background="bg-white dark:bg-gray-800" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
