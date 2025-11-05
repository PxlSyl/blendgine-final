import type { ForcedCombinations, Incompatibilities } from '@/types/effect';

interface UseCombinationValidationProps {
  firstCategory: string;
  firstItem: string;
  secondCategory: string;
  secondItem: string;
  incompatibilitiesData?: ForcedCombinations | Incompatibilities | null;
}

export const useCombinationValidation = ({
  firstCategory,
  firstItem,
  secondCategory,
  secondItem,
  incompatibilitiesData,
}: UseCombinationValidationProps): boolean => {
  if (!firstCategory || !firstItem || !secondCategory || !secondItem || !incompatibilitiesData) {
    return false;
  }

  const data = incompatibilitiesData as Record<string, Record<string, Record<string, unknown>>>;
  const firstPath = data[firstCategory]?.[firstItem]?.[secondCategory];
  const secondPath = data[secondCategory]?.[secondItem]?.[firstCategory];

  return (
    !!(Array.isArray(firstPath) && firstPath.includes(secondItem)) ||
    !!(Array.isArray(secondPath) && secondPath.includes(firstItem))
  );
};
