import { memo } from 'react';
import { motion } from 'framer-motion';

import { Tooltip } from '../ToolTip';

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export interface ActionButtonProps {
  label: string;
  description: string;
  onClick: () => void;
  color: 'purple' | 'pink' | 'blue' | 'red';
  delay?: number;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  className?: string;
}

const ActionButtonComponent = ({
  label,
  description,
  onClick,
  color,
  delay = 0,
  icon: Icon,
  disabled = false,
  className = '',
}: ActionButtonProps) => {
  const getColorClasses = () => {
    switch (color) {
      case 'purple':
        return 'bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]';
      case 'pink':
        return 'bg-gradient-to-b from-[rgb(var(--color-secondary))] to-[rgb(var(--color-secondary-dark))]';
      case 'blue':
        return 'bg-gradient-to-b from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-dark))]';
      case 'red':
        return 'bg-gradient-to-b from-[rgb(var(--color-quaternary))] to-[rgb(var(--color-quaternary-dark))]';
      default:
        return 'bg-gradient-to-b from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-dark))]';
    }
  };

  const getBorderColor = () => {
    switch (color) {
      case 'purple':
        return '1px solid rgb(var(--color-primary))';
      case 'pink':
        return '1px solid rgb(var(--color-secondary))';
      case 'blue':
        return '1px solid rgb(var(--color-accent))';
      case 'red':
        return '1px solid rgb(var(--color-quaternary))';
      default:
        return '1px solid rgb(var(--color-primary))';
    }
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <Tooltip tooltip={description}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={buttonVariants}
        transition={{ duration: 0.3, ease: 'easeOut', delay }}
        className={`flex items-center rounded-sm overflow-hidden
          ${getColorClasses()} ${disabledClass} ${className}`}
        style={{
          boxShadow:
            'inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 2px rgba(0,0,0,0.2), inset -2px 0 2px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2)',
          border: getBorderColor(),
        }}
      >
        <button
          onClick={onClick}
          disabled={disabled}
          className={`text-sm font-medium flex items-center text-white ${disabledClass}`}
          style={{
            textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
          }}
        >
          {Icon && (
            <div className="flex items-center justify-center px-2 py-1 border-r border-r-white/20">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="hidden sm:block px-2 py-1">{label}</div>
        </button>
      </motion.div>
    </Tooltip>
  );
};

ActionButtonComponent.displayName = 'ActionButton';

export const ActionButton = memo(ActionButtonComponent);
