import React from 'react';
import { useAuthStore } from '../store/auth';
import { AccountIcon, CreditIcon, InfoIcon } from '../icons';
import { BaseModal } from '@/components/shared/modals';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const credits = 100;

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await logout();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Information"
      icon={<AccountIcon className="w-4 h-4" />}
      iconColor="text-pink-500"
      width="w-[400px]"
      height="h-auto"
      showFooter={false}
    >
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</span>
          </div>
          {user?.name && (
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Name</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Available credits:
            </span>
            <div className="flex items-center gap-2 px-2 rounded-sm bg-pink-500/10">
              <span className="text-lg font-bold bg-linear-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                {credits}
              </span>
              <CreditIcon className="w-5 h-5 text-pink-500" />
            </div>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Credits are used for generating NFTs and applying special effects.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Manage
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Buy Credits
          </button>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={(e) => void handleLogout(e)}
              className="px-4 py-2 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Log out
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 rounded-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default AccountModal;
