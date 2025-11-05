import React, { useState } from 'react';

import { ContextButton } from './ContextButton';
import { AccountIcon } from '@/components/icons';
import AccountModal from '@/components/account/AccountModal';

import { useKeyboardShortcuts } from '@/components/hooks/useKeyboardShortcuts';
import { useProjectSetup } from '@/components/store/projectSetup/hook';
import { useStore } from '@/components/store';

const AccountButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasSelectedFolder } = useProjectSetup();
  const sidebarFull = useStore((state) => state.sidebarFull);

  const handleOpenModal = () => {
    if (!hasSelectedFolder) {
      setIsModalOpen(true);
    }
  };

  useKeyboardShortcuts({
    'shift+a': handleOpenModal,
  });

  return (
    <>
      <ContextButton
        isSelected={isModalOpen}
        onClick={handleOpenModal}
        icon={<AccountIcon />}
        label="Account"
        disabled={hasSelectedFolder}
        sidebarFull={sidebarFull}
      />
      <AccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default AccountButton;
