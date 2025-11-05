import React from 'react';
import { motion } from 'framer-motion';

import { useUpdateStore } from '@/components/store/update';

import RarityViewer from '../rarityviewer';
import UpdateSingleMetadata from '../updatesingle';
import UpdateBulkMetadata from '../updatebulk';

const MetadataStepContent: React.FC = () => {
  const { metadataStep } = useUpdateStore();

  const renderStepContent = () => {
    switch (metadataStep) {
      case 1:
        return <RarityViewer />;
      case 2:
        return <UpdateSingleMetadata />;
      case 3:
        return <UpdateBulkMetadata />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="h-full bg-white dark:bg-gray-900"
    >
      <div className="h-full overflow-y-auto px-6 py-4">{renderStepContent()}</div>
    </motion.div>
  );
};

export default MetadataStepContent;
