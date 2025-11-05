import React from 'react';

interface ValidationErrorsProps {
  validationError?: string | null;
  operationError?: string | null;
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  validationError,
  operationError,
}) => {
  if (!validationError && !operationError) {
    return null;
  }

  return (
    <>
      {validationError && (
        <div className="text-[rgb(var(--color-quaternary))] text-sm font-medium mt-2">
          {validationError}
        </div>
      )}
      {operationError && (
        <div className="text-[rgb(var(--color-quaternary))] text-sm font-medium mt-2">
          {operationError}
        </div>
      )}
    </>
  );
};
