import { useMemo } from 'react';
import { useGenerateStore } from '@/components/store/generate';

export const useFilterData = () => {
  const { consoleMessages } = useGenerateStore();

  const sortedConsoleMessages = useMemo(() => {
    const sorted = [...consoleMessages].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    return sorted;
  }, [consoleMessages]);

  return { sortedConsoleMessages };
};
