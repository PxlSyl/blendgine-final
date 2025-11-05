import { useMemo } from 'react';
import { useGenerateStore } from '@/components/store/generate';

export const useSortedData = () => {
  const { consoleMessages } = useGenerateStore();

  const sortedConsoleMessages = useMemo(() => {
    return [...consoleMessages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }, [consoleMessages]);

  return {
    sortedConsoleMessages,
  };
};
