import type { SolanaMetadataConfig } from '@/types/effect';

export const defaultSolanaConfig: SolanaMetadataConfig = {
  symbol: '',
  sellerFeeBasisPoints: 500,
  externalUrl: '',
  creators: [{ address: '', share: 100 }],
};
