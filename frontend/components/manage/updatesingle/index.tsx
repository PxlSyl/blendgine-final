import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { api } from '@/services';

import { useUpdateStore } from '@/components/store/update';

interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}
import MetadataStepWrapper from '@/components/manage/heading/MetadataStepWrapper';
import MetadataStepHeader from '@/components/manage/heading/MetadataStepHeader';
import { AttentionIcon, CheckTrueIcon } from '@/components/icons';

const UpdateSingleMetadata: React.FC = () => {
  const {
    jsonData,
    filePath,
    newFieldKey,
    newFieldValue,
    newTraitType,
    newAttributeValue,
    actionType,
    isCreateFromScratchClicked,
    setJsonData,
    setFilePath,
    setNewFieldKey,
    setNewFieldValue,
    setNewTraitType,
    setNewAttributeValue,
    setActionType,
    setIsCreateFromScratchClicked,
  } = useUpdateStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFilePath(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target?.result as string) as Record<string, unknown>;
          setJsonData(parsedData);
          setActionType('update');
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    } else {
      console.error('No file selected or file path is undefined');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createFromScratch = () => {
    const defaultStructure = {
      name: '',
      description: '',
      image: '',
      attributes: [
        {
          trait_type: '',
          value: '',
        },
      ],
    };
    setJsonData(defaultStructure);
    setFilePath(null);
    setActionType('create');
    setIsCreateFromScratchClicked(true);
  };

  const isSaveEnabled = () => {
    if (!jsonData) {
      return false;
    }
    const { name, description, image, attributes } = jsonData;
    return (
      name?.trim() !== '' &&
      description?.trim() !== '' &&
      image?.trim() !== '' &&
      Array.isArray(attributes) &&
      attributes.length > 0 &&
      attributes.some((attr) => attr.trait_type.trim() !== '' && attr.value.trim() !== '')
    );
  };

  const handleFieldChange = (key: string, value: string) => {
    if (jsonData) {
      setJsonData({ ...jsonData, [key]: value });
    }
  };

  const handleAddField = () => {
    if (jsonData && newFieldKey) {
      const { attributes, ...rest } = jsonData;
      const updatedJsonData = {
        ...rest,
        [newFieldKey]: newFieldValue,
        attributes,
      };
      setJsonData(updatedJsonData);
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const handleRemoveField = (key: string) => {
    if (jsonData) {
      const { [key]: _, ...rest } = jsonData;
      setJsonData(rest);
    }
  };

  const handleAttributeChange = (index: number, key: string, value: string) => {
    if (jsonData && Array.isArray(jsonData.attributes)) {
      const updatedAttributes = [...jsonData.attributes];
      updatedAttributes[index] = { ...updatedAttributes[index], [key]: value };
      setJsonData({ ...jsonData, attributes: updatedAttributes });
    }
  };

  const handleRemoveAttribute = (index: number) => {
    if (jsonData && Array.isArray(jsonData.attributes)) {
      const updatedAttributes = jsonData.attributes.filter((_, i) => i !== index);
      setJsonData({ ...jsonData, attributes: updatedAttributes });
    }
  };

  const handleAddAttribute = () => {
    if (jsonData && newTraitType && newAttributeValue) {
      const newAttribute = { trait_type: newTraitType, value: newAttributeValue };
      const updatedAttributes = jsonData.attributes
        ? [...jsonData.attributes, newAttribute]
        : [newAttribute];
      setJsonData({ ...jsonData, attributes: updatedAttributes });
      setNewTraitType('');
      setNewAttributeValue('');
    }
  };

  const saveChanges = async () => {
    if (!actionType) {
      return;
    }

    try {
      let result: SaveResult | undefined;
      if (jsonData) {
        const defaultFileName = filePath ?? 'untitled.json';
        result = (await api.saveSingleJsonFileDialog(jsonData, defaultFileName)) as SaveResult;
      }

      if (result?.success) {
        if (result.filePath) {
          setFilePath(result.filePath);
        }
        setIsSaveSuccessful(true);
        setTimeout(() => setIsSaveSuccessful(false), 3000);
      } else {
        console.error('Error saving file:', result?.error);
      }
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  const buttonClasses = (isSelected: boolean) => `
    px-4 py-2 rounded mb-4 inline-block ml-2 cursor-pointer
    ${
      isSelected
        ? 'bg-purple-500 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
    }
    transition-colors duration-150 ease-in-out
  `;

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

  const addButtonClasses = `
    px-2 py-1 rounded-md font-medium transition-colors duration-150 ease-in-out mb-5
    bg-green-100 dark:bg-green-500 text-green-700 dark:text-green-100
    hover:bg-green-200 dark:hover:bg-green-600
  `;

  const removeButtonClasses = `
    px-2 py-1 rounded-md font-medium transition-colors duration-150 ease-in-out mb-5
    bg-red-300 dark:bg-red-500 text-red-800 dark:text-red-100
    hover:bg-red-400 dark:hover:bg-red-600
  `;

  const warningAlertClasses = `
    mt-8 p-3 rounded flex items-center space-x-3
    bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 
    text-yellow-700 dark:text-yellow-200
  `;

  return (
    <MetadataStepWrapper
      onSaveMetadata={() => void saveChanges()}
      buttonText="Save Changes"
      buttonDisabled={!isSaveEnabled()}
    >
      <MetadataStepHeader title="Manage single .json files" />
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Utility to create or update .json files of your legendaries.
      </p>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
        ref={fileInputRef}
      />
      <motion.label
        htmlFor="file-upload"
        className={buttonClasses(actionType === 'update')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        Choose File
      </motion.label>
      <motion.button
        onClick={createFromScratch}
        className={buttonClasses(actionType === 'create')}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        Create from Scratch
      </motion.button>
      {jsonData && (
        <div>
          <div className="text-xl font-bold text-purple-500 mb-6 mt-6">Edit Fields:</div>
          <div className="text-lg font-bold text-pink-500 mb-6">Main Fields</div>
          {Object.entries(jsonData).map(
            ([key, value]) =>
              key !== 'compiler' &&
              key !== 'attributes' && (
                <div key={key} className="mb-4 flex items-center space-x-2">
                  <div className="flex-1">
                    <div className={inputWrapperClasses}>
                      <div className={inputGradientClasses}></div>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className={inputClasses}
                      />
                      <label className={labelClasses}>{key}</label>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveField(key)} className={removeButtonClasses}>
                    Remove
                  </button>
                </div>
              )
          )}
          <div className="mb-4 flex items-center space-x-2">
            <div className="flex-1">
              <div className={inputWrapperClasses}>
                <div className={inputGradientClasses}></div>
                <input
                  type="text"
                  placeholder="New field key"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className={inputWrapperClasses}>
                <div className={inputGradientClasses}></div>
                <input
                  type="text"
                  placeholder="New field value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
            <motion.button
              onClick={handleAddField}
              className={addButtonClasses}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              Add Field
            </motion.button>
          </div>
          {jsonData.attributes && Array.isArray(jsonData.attributes) && (
            <div>
              <div className="text-lg font-bold text-pink-500 mb-6">Attributes</div>
              <div className="flex mb-2 space-x-2">
                <div className="flex-1 font-semibold">Trait Type</div>
                <div className="flex-1 font-semibold">Value</div>
                <div className="w-20"></div> {/* Placeholder for Remove button */}
              </div>
              {jsonData.attributes.map((attr, index) => (
                <div key={index} className="mb-4 flex items-center space-x-2">
                  <div className="flex-1">
                    <div className={inputWrapperClasses}>
                      <div className={inputGradientClasses}></div>
                      <input
                        type="text"
                        value={attr.trait_type || ''}
                        onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                        placeholder="Trait Type"
                        className={inputClasses}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={inputWrapperClasses}>
                      <div className={inputGradientClasses}></div>
                      <input
                        type="text"
                        value={attr.value || ''}
                        onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                        placeholder="Value"
                        className={inputClasses}
                      />
                    </div>
                  </div>
                  <motion.button
                    onClick={() => handleRemoveAttribute(index)}
                    className={removeButtonClasses}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    Remove
                  </motion.button>
                </div>
              ))}
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex-1">
                  <div className={inputWrapperClasses}>
                    <div className={inputGradientClasses}></div>
                    <input
                      type="text"
                      placeholder="New trait type"
                      value={newTraitType}
                      onChange={(e) => setNewTraitType(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className={inputWrapperClasses}>
                    <div className={inputGradientClasses}></div>
                    <input
                      type="text"
                      placeholder="New attribute value"
                      value={newAttributeValue}
                      onChange={(e) => setNewAttributeValue(e.target.value)}
                      className={inputClasses}
                    />
                  </div>
                </div>
                <motion.button
                  onClick={handleAddAttribute}
                  className={addButtonClasses}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  Add Attribute
                </motion.button>
              </div>
            </div>
          )}
        </div>
      )}
      {isCreateFromScratchClicked && !isSaveEnabled() && (
        <div className={warningAlertClasses}>
          <AttentionIcon className="w-6 h-6 shrink-0" />
          <span className="text-sm sm:text-base grow">
            Please fill in all main fields and at least one attribute to enable saving.
          </span>
        </div>
      )}
      <AnimatePresence>
        {isSaveSuccessful && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-8 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center"
          >
            <CheckTrueIcon className="w-6 h-6 text-green-700 mr-2" />
            <span>File has been successfully saved.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </MetadataStepWrapper>
  );
};

export default UpdateSingleMetadata;
