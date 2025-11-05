import React from 'react';

import AppHeader from './AppHeader';
import GradientBar from '@/components/shared/GradientBar';

const Header: React.FC = () => {
  return (
    <div className="bg-gray-300 dark:bg-gray-900">
      <AppHeader />
      <GradientBar position="top" />
    </div>
  );
};

export default Header;
