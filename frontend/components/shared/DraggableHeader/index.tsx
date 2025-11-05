import React, { memo, ReactNode } from 'react';

interface DraggableHeaderProps {
  children: ReactNode;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = memo(({ children }) => {
  return <div className="grow overflow-auto">{children}</div>;
});

DraggableHeader.displayName = 'DraggableHeader';

export default DraggableHeader;
