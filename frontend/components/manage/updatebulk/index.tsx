import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { blockchainFields } from '@/components/metadataFormats';
import { useUpdateStore } from '@/components/store/update';

import Toggle from '@/components/shared/Toggle';

const UpdateBulkMetadata: React.FC = () => {
  const {
    collectionHostingUrl,
    setCollectionHostingUrl,
    updateCollectionName,
    updateCollectionDescription,
  } = useUpdateStore();

  const [selectedBlockchain, setSelectedBlockchain] =
    useState<keyof typeof blockchainFields>('ethereum');
  const [metadataFields, setMetadataFields] = useState<Record<string, string>>({});
  const [showNameUpdate, setShowNameUpdate] = useState(false);
  const [showDescriptionUpdate, setShowDescriptionUpdate] = useState(false);
  const [showHostingUrlUpdate, setShowHostingUrlUpdate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleBlockchainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBlockchain(e.target.value as keyof typeof blockchainFields);
    setMetadataFields({});
  };

  const handleMetadataChange = (field: string, value: string) => {
    setMetadataFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showNameUpdate && newName) {
      updateCollectionName(newName);
    }
    if (showDescriptionUpdate && newDescription) {
      updateCollectionDescription(newDescription);
    }
  };

  const inputWrapperClasses = 'relative group mb-6';
  const inputGradientClasses =
    'absolute inset-0 bg-linear-to-r from-purple-400/75 to-pink-600/75 rounded-lg blur-sm';
  const inputClasses = `w-full px-4 py-3 rounded-lg transition-all duration-300 ease-in-out relative
    bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:bg-gray-50 dark:focus:bg-gray-600
    placeholder-gray-400 focus:outline-none`;

  const labelClasses = `z-10 pr-2 absolute text-xs font-bold 
    text-gray-700 dark:text-gray-300
    transition-all duration-300 ease-in-out
    left-0 -top-2.5 px-1 rounded
    bg-white/75 dark:bg-gray-800/75`;

  const renderField = (field: { name: string; type: string; label: string }) => (
    <div key={field.name} className="mb-6">
      <label htmlFor={field.name} className="block mb-2 text-gray-900 dark:text-white">
        {field.label}:
      </label>
      <input
        type={field.type}
        id={field.name}
        value={metadataFields[field.name] || ''}
        onChange={(e) => handleMetadataChange(field.name, e.target.value)}
        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Update Metadata</h2>

      <div className="mb-6 p-4 border rounded border-gray-300 dark:border-gray-600">
        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
          Update Collection Details
        </h3>
        <div className="mb-6 flex items-center">
          <Toggle
            checked={showNameUpdate}
            onChange={() => setShowNameUpdate(!showNameUpdate)}
            size="md"
            activeColor="bg-purple-600"
            inactiveColor="bg-gray-300 dark:bg-gray-600"
            thumbColor="bg-purple-500"
          />
          <span className="ml-2 text-gray-900 dark:text-white">Update Collection Name</span>
        </div>
        <AnimatePresence>
          {showNameUpdate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={inputWrapperClasses}
            >
              <div className={inputGradientClasses}></div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Awesome New NFT Collection Name"
                className={`${inputClasses} pt-4`}
              />
              <label className={labelClasses}>Collection Name</label>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mb-6 flex items-center">
          <Toggle
            checked={showDescriptionUpdate}
            onChange={() => setShowDescriptionUpdate(!showDescriptionUpdate)}
            size="md"
            activeColor="bg-purple-600"
            inactiveColor="bg-gray-300 dark:bg-gray-600"
            thumbColor="bg-purple-500"
          />
          <span className="ml-2 text-gray-900 dark:text-white">Update Collection Description</span>
        </div>
        <AnimatePresence>
          {showDescriptionUpdate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={inputWrapperClasses}
            >
              <div className={inputGradientClasses}></div>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="My Awesome New NFT Collection Description"
                className={`${inputClasses} pt-4`}
              />
              <label className={labelClasses}>Collection Description</label>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mb-6 flex items-center">
          <Toggle
            checked={showHostingUrlUpdate}
            onChange={() => setShowHostingUrlUpdate(!showHostingUrlUpdate)}
            size="md"
            activeColor="bg-purple-600"
            inactiveColor="bg-gray-300 dark:bg-gray-600"
            thumbColor="bg-purple-500"
          />
          <span className="ml-2 text-gray-900 dark:text-white">Update Collection Hosting URL</span>
        </div>
        <AnimatePresence>
          {showHostingUrlUpdate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={inputWrapperClasses}
            >
              <div className={inputGradientClasses}></div>
              <input
                type="text"
                id="hosting-url"
                value={collectionHostingUrl}
                onChange={(e) => setCollectionHostingUrl(e.target.value)}
                placeholder="My New Collection Hosting URL"
                className={`${inputClasses} pt-4`}
              />
              <label className={labelClasses}>Collection Hosting URL</label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-6">
        <label htmlFor="blockchain" className="block mb-2 text-gray-900 dark:text-white">
          Target Blockchain:
        </label>
        <select
          id="blockchain"
          value={selectedBlockchain}
          onChange={handleBlockchainChange}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
        >
          {Object.keys(blockchainFields).map((blockchain) => (
            <option key={blockchain} value={blockchain}>
              {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {blockchainFields[selectedBlockchain].map(renderField)}
      <button
        type="submit"
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors duration-200"
      >
        Update Metadata
      </button>
    </form>
  );
};

export default UpdateBulkMetadata;
