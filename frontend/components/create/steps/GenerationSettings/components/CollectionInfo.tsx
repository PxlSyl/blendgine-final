import React from 'react';
import { motion, Variants } from 'framer-motion';
import { InputField } from '@/components/shared/InputField';
import { InfoIcon } from '@/components/icons';
import CheckboxWithLabel from '@/components/shared/CheckboxWithLabel';

interface CollectionInfoProps {
  collectionName: string;
  collectionDescription: string;
  includeRarity: boolean;
  handleCollectionNameChange: (value: string) => void;
  handleCollectionDescriptionChange: (value: string) => void;
  setIncludeRarity: (value: boolean) => void;
  transitionVariants: Variants;
}

export const CollectionInfo: React.FC<CollectionInfoProps> = ({
  collectionName,
  collectionDescription,
  includeRarity,
  handleCollectionNameChange,
  handleCollectionDescriptionChange,
  setIncludeRarity,
  transitionVariants,
}) => {
  const collectionFields = [
    {
      label: 'Collection Name',
      value: collectionName,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        handleCollectionNameChange(e.target.value),
      placeholder: 'My Awesome Collection',
      type: 'text',
    },
    {
      label: 'Collection Description',
      value: collectionDescription,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        handleCollectionDescriptionChange(e.target.value),
      placeholder: 'Describe your amazing collection',
      type: 'text',
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={transitionVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="p-2 rounded-sm shadow-md mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className="text-md font-semibold text-[rgb(var(--color-primary))] mb-4">
        Collection Informations
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
        {collectionFields.map((field, index) => (
          <InputField
            key={field.label}
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            type={field.type}
            placeholder={field.placeholder}
            index={index}
            showContent={true}
          />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <CheckboxWithLabel
          label="Include rarity metadata"
          checked={includeRarity}
          onChange={setIncludeRarity}
        />
        <div className="hidden sm:flex text-sm italic items-center text-gray-500 dark:text-gray-400">
          <InfoIcon className="w-6 h-6 ml-4 mr-2 shrink-0" />
          <span className="flex-1">
            If unchecked, the lines concerning your layers will not appear (useful for example for
            some games).
          </span>
        </div>
      </div>
    </motion.div>
  );
};
