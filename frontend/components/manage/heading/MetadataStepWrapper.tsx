import React from 'react';

import MetadataStepButton from './MetadataStepButton';

interface MetadataStepWrapperProps {
  children: React.ReactNode;
  onSaveMetadata: (event: React.MouseEvent<HTMLButtonElement>) => void;
  buttonText: string;
  buttonDisabled?: boolean;
  buttonClassName?: string;
  buttonProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;
}

const MetadataStepWrapper: React.FC<MetadataStepWrapperProps> = ({
  children,
  onSaveMetadata,
  buttonText,
  buttonDisabled = false,
  buttonClassName = '',
  buttonProps = {},
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="grow overflow-y-auto px-2 mb-4">{children}</div>
      <MetadataStepButton
        onClick={onSaveMetadata}
        disabled={buttonDisabled}
        text={buttonText}
        className={buttonClassName}
        {...buttonProps}
      />
    </div>
  );
};

export default MetadataStepWrapper;
