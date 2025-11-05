export interface FooterActionsProps {
  handlers: {
    handleGenerate: () => Promise<void>;
    onMixLegendaries: () => Promise<void>;
  };
}
