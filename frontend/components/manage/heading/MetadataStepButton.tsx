import React, { ButtonHTMLAttributes } from 'react';

interface MetadataStepButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  text: string;
}

const MetadataStepButton: React.FC<MetadataStepButtonProps> = ({
  onClick,
  disabled = false,
  text,
  className = '',
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-linear-to-r from-purple-400 to-pink-600 rounded-bl-xl rounded-br-xl hover:from-purple-500 hover:to-pink-700 text-white text-xl font-bold py-2 px-6 rounded-md transition duration-300 ease-in-out transform mb-6 flex items-center justify-center ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {text}
    </button>
  );
};

export default MetadataStepButton;
