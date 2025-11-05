import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharsetIcon, ChevronDownIcon } from '@/components/icons';
import SearchBar from '@/components/shared/SearchBar';
import { ActionButton } from '@/components/shared/ActionButton';
import { BaseModal } from '@/components/shared/modals';

interface ModalDropdownProps {
  options: string[];
  value: string;
  onChange: (option: string) => void;
}

const ModalDropdown: React.FC<ModalDropdownProps> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left rounded-sm flex justify-between items-center text-xs sm:text-sm
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600
          focus:outline-none border border-[rgb(var(--color-primary)/0.2)] hover:border-[rgb(var(--color-primary)/0.4)] transition-colors duration-200 cursor-pointer"
      >
        <span className="truncate">{value}</span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 rounded-sm shadow-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto z-10"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs sm:text-sm transition-colors duration-200 cursor-pointer
                    ${
                      option === value
                        ? 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)] dark:bg-[rgb(var(--color-primary)/0.3)]'
                        : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CharsetPresetsModalProps {
  categories: Array<{
    name: string;
    presets: Array<{
      name: string;
      charset: string;
      font: string;
    }>;
  }>;
  selectedCharset: string;
  onSelectCharset: (charset: string) => void;
}

export const CharsetPresetsModal: React.FC<CharsetPresetsModalProps> = ({
  categories,
  selectedCharset,
  onSelectCharset,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categoryOptions = ['All', ...categories.map((cat) => cat.name)];

  const filteredCategories = useMemo(() => {
    return categories
      .filter((category) => selectedCategory === 'All' || category.name === selectedCategory)
      .map((category) => ({
        name: category.name,
        presets: category.presets
          .filter((preset) => preset.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((cat) => cat.presets.length > 0);
  }, [categories, searchTerm, selectedCategory]);

  return (
    <>
      <ActionButton
        label="Charsets"
        description="Choose ASCII character set"
        onClick={() => setIsOpen(true)}
        color="blue"
        icon={CharsetIcon}
      />

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Charset Preset"
        icon={<CharsetIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
        iconColor="text-[rgb(var(--color-secondary))]"
        contentClassName="px-1"
        showFooter={true}
        footerProps={{
          showConfirm: false,
          closeText: 'Close',
        }}
        searchBar={
          <div className="space-y-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <ModalDropdown
              options={categoryOptions}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-4 px-1 mb-8">
            {filteredCategories.map((category) => (
              <div key={category.name}>
                <div className="font-semibold text-[rgb(var(--color-primary))] mb-1 text-sm uppercase tracking-wide">
                  {category.name}
                </div>
                <div className="space-y-2">
                  {category.presets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        onSelectCharset(preset.charset);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${
                        selectedCharset === preset.charset
                          ? 'bg-[rgb(var(--color-primary)/0.1)] dark:bg-[rgb(var(--color-primary)/0.2)] text-[rgb(var(--color-primary))]'
                          : ''
                      }`}
                    >
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {preset.charset}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BaseModal>
    </>
  );
};
