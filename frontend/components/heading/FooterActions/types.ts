export interface FooterActionsProps {
  handlers: {
    handleGenerate: () => Promise<void>;
    handleApplyFilters: () => Promise<void>;
    onMixLegendaries: () => Promise<void>;
  };
}
