import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import { ChevronDownIcon } from '@/components/icons';
import { capitalize, removeFileExtension } from '@/utils/functionsUtils';

interface DropdownProps {
  options: string[];
  value: string;
  placeholder: string;
  onChange: (option: string) => void;
  textColorClass: string;
  hoverBgClass?: string;
  selectedColor?: 'purple' | 'pink' | 'blue';
  renderOption?: (option: string) => React.ReactNode;
  renderValue?: (value: string) => React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder,
  onChange,
  textColorClass,
  hoverBgClass = 'hover:bg-gray-50 dark:hover:bg-gray-600',
  selectedColor = 'purple',
  renderOption,
  renderValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const portalId = 'dropdown-portal';
    let portal = document.getElementById(portalId) as HTMLDivElement;

    if (!portal) {
      portal = document.createElement('div');
      portal.id = portalId;
      portal.style.position = 'fixed';
      portal.style.top = '0';
      portal.style.left = '0';
      portal.style.zIndex = '999999';
      portal.style.pointerEvents = 'none';
      document.body.appendChild(portal);
    }

    portalRef.current = portal;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = () => setIsOpen(false);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    }, 10);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen]);

  const getPosition = () => {
    if (!triggerRef.current) {
      return { top: 0, left: 0, width: 0 };
    }
    const rect = triggerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(option);
    setIsOpen(false);
  };

  const getSelectedColorClass = (color: 'purple' | 'pink' | 'blue') => {
    switch (color) {
      case 'purple':
        return 'text-[rgb(var(--color-primary))]';
      case 'pink':
        return 'text-[rgb(var(--color-secondary))]';
      case 'blue':
        return 'text-[rgb(var(--color-accent))]';
      default:
        return 'text-[rgb(var(--color-primary))]';
    }
  };

  const position = getPosition();

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleDropdown}
        className={`relative w-full px-3 py-2 text-left rounded-sm flex justify-between items-center text-xs sm:text-sm
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600
          cursor-pointer focus:outline-none`}
        style={{
          boxShadow: isOpen
            ? 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)'
            : 'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 1px 0 0 rgba(255,255,255,0.3), inset -3px 0 3px rgba(0,0,0,0.1), inset 0 -3px 3px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
          border: isOpen
            ? '1px solid rgb(var(--color-primary))'
            : '1px solid rgb(var(--color-primary) / 0.2)',
          textShadow: isOpen ? '0 -1px 0 rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <span className={`truncate ${!value ? textColorClass : ''}`}>
          {renderValue ? renderValue(value) : value || placeholder}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'transform-rotate-180' : ''}`}
        />
      </div>

      {isOpen &&
        portalRef.current &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute rounded-sm shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto"
              style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                width: position.width,
                pointerEvents: 'auto',
                boxShadow:
                  '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {options.map((option) => (
                  <div
                    key={option}
                    onClick={(e) => handleSelect(option, e)}
                    className={`px-3 py-2 cursor-pointer text-xs sm:text-sm ${hoverBgClass} ${
                      option === value
                        ? getSelectedColorClass(selectedColor)
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {renderOption ? renderOption(option) : capitalize(removeFileExtension(option))}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>,
          portalRef.current
        )}
    </>
  );
};

export default Dropdown;
