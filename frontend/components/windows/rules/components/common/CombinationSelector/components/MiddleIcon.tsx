import React from 'react';
import { motion } from 'framer-motion';
import { AttentionIcon, LinkIcon } from '@/components/icons';

interface MiddleIconProps {
  ruleType: 'incompatibility' | 'forcedCombination';
}

export const MiddleIcon: React.FC<MiddleIconProps> = ({ ruleType }) => {
  const isIncompatibility = ruleType === 'incompatibility';
  const Icon = isIncompatibility ? AttentionIcon : LinkIcon;
  const iconClass = isIncompatibility
    ? 'text-[rgb(var(--color-secondary))]'
    : 'text-[rgb(var(--color-accent))]';

  return (
    <motion.div
      key={`middle-${ruleType}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative group sm:w-2/12"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-primary-light))]/75 to-[rgb(var(--color-secondary-dark))]/75 rounded-sm blur-sm"></div>
      <div className="relative flex flex-col items-center px-2 py-1 rounded-sm bg-white dark:bg-gray-800">
        <Icon className={`w-6 h-6 mb-1 ${iconClass}`} />
      </div>
    </motion.div>
  );
};
