export const metadataFormats = {
  ethereum: {
    format: (data: {
      name: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
    }) => ({
      name: data.name,
      description: data.description,
      image: data.image,
      attributes: data.attributes.map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
    }),
  },
  solana: {
    format: (data: {
      name: string;
      symbol: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
      creator: string;
    }) => ({
      name: data.name,
      symbol: data.symbol || '',
      description: data.description,
      seller_fee_basis_points: 500,
      image: data.image,
      attributes: data.attributes.map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
      properties: {
        files: [{ uri: data.image, type: 'image/png' }],
        category: 'image',
        creators: [{ address: data.creator || '', share: 100 }],
      },
    }),
  },
  tezos: {
    format: (data: {
      name: string;
      description: string;
      tags: string[];
      symbol: string;
      image: string;
      thumbnail: string;
      creator: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
    }) => ({
      name: data.name,
      description: data.description,
      tags: data.tags || [],
      symbol: data.symbol || '',
      artifactUri: data.image,
      displayUri: data.image,
      thumbnailUri: data.thumbnail || data.image,
      creators: [data.creator || ''],
      formats: [{ uri: data.image, mimeType: 'image/png' }],
      attributes: data.attributes.map((attr) => ({
        name: attr.trait_type,
        value: attr.value,
      })),
    }),
  },
  flow: {
    format: (data: {
      name: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
      external_url: string;
    }) => ({
      name: data.name,
      description: data.description,
      image: data.image,
      attributes: data.attributes.map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
      external_url: data.external_url || '',
    }),
  },
  cardano: {
    format: (data: {
      policy_id: string;
      asset_name: string;
      name: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
    }) => ({
      '721': {
        [data.policy_id || 'policy_id']: {
          [data.asset_name || 'asset_name']: {
            name: data.name,
            description: data.description,
            image: data.image,
            mediaType: 'image/png',
            files: [
              {
                name: 'asset.png',
                mediaType: 'image/png',
                src: data.image,
              },
            ],
            attributes: Object.fromEntries(
              data.attributes.map((attr) => [attr.trait_type, attr.value])
            ),
          },
        },
      },
    }),
  },
  algorand: {
    format: (data: {
      name: string;
      description: string;
      image: string;
      image_integrity: string;
      external_url: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
      creator: { name: string; email: string };
    }) => ({
      name: data.name,
      description: data.description,
      image: data.image,
      image_integrity: data.image_integrity || '',
      image_mimetype: 'image/png',
      external_url: data.external_url || '',
      attributes: data.attributes.map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
      properties: {
        creator: data.creator || '',
      },
    }),
  },
  btc_ordinals: {
    format: (data: {
      tick: string;
      name: string;
      description: string;
      image: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
    }) => ({
      p: 'ord',
      op: 'mint',
      tick: data.tick || 'TICK',
      amt: '1',
      name: data.name,
      description: data.description,
      image: data.image,
      attributes: data.attributes.map((attr) => ({
        trait_type: attr.trait_type,
        value: attr.value,
      })),
    }),
  },
};

export const blockchainFields = {
  ethereum: [],
  solana: [
    { name: 'symbol', type: 'text', label: 'Symbol' },
    { name: 'seller_fee_basis_points', type: 'number', label: 'Seller Fee Basis Points' },
    { name: 'external_url', type: 'text', label: 'External URL' },
    {
      name: 'properties',
      type: 'object',
      label: 'Properties',
      fields: [
        {
          name: 'files',
          type: 'array',
          label: 'Files',
          itemFields: [
            { name: 'uri', type: 'text', label: 'URI' },
            { name: 'type', type: 'text', label: 'Type' },
          ],
        },
        { name: 'category', type: 'text', label: 'Category' },
        {
          name: 'creators',
          type: 'array',
          label: 'Creators',
          itemFields: [
            { name: 'address', type: 'text', label: 'Address' },
            { name: 'share', type: 'number', label: 'Share' },
          ],
        },
      ],
    },
  ],
  tezos: [
    { name: 'symbol', type: 'text', label: 'Symbol' },
    { name: 'artifactUri', type: 'text', label: 'Artifact URI' },
    { name: 'displayUri', type: 'text', label: 'Display URI' },
    { name: 'thumbnailUri', type: 'text', label: 'Thumbnail URI' },
    { name: 'creators', type: 'array', label: 'Creators' },
    {
      name: 'formats',
      type: 'array',
      label: 'Formats',
      itemFields: [
        { name: 'uri', type: 'text', label: 'URI' },
        { name: 'mimeType', type: 'text', label: 'MIME Type' },
      ],
    },
    {
      name: 'royalties',
      type: 'object',
      label: 'Royalties',
      fields: [
        { name: 'decimals', type: 'number', label: 'Decimals' },
        { name: 'shares', type: 'object', label: 'Shares' },
      ],
    },
    { name: 'rights', type: 'text', label: 'Rights' },
    { name: 'rightUri', type: 'text', label: 'Right URI' },
    { name: 'externalUri', type: 'text', label: 'External URI' },
    { name: 'isBooleanAmount', type: 'checkbox', label: 'Is Boolean Amount' },
    { name: 'shouldPreferSymbol', type: 'checkbox', label: 'Should Prefer Symbol' },
  ],
  flow: [
    { name: 'external_url', type: 'text', label: 'External URL' },
    { name: 'background_color', type: 'color', label: 'Background Color' },
    { name: 'animation_url', type: 'text', label: 'Animation URL' },
  ],
  cardano: [
    { name: 'policy_id', type: 'text', label: 'Policy ID' },
    { name: 'asset_name', type: 'text', label: 'Asset Name' },
    { name: 'mediaType', type: 'text', label: 'Media Type' },
    {
      name: 'files',
      type: 'array',
      label: 'Files',
      itemFields: [
        { name: 'name', type: 'text', label: 'Name' },
        { name: 'mediaType', type: 'text', label: 'Media Type' },
        { name: 'src', type: 'text', label: 'Source' },
      ],
    },
    { name: 'image_integrity', type: 'text', label: 'Image Integrity' },
  ],
  algorand: [
    { name: 'unit_name', type: 'text', label: 'Unit Name' },
    { name: 'asset_name', type: 'text', label: 'Asset Name' },
    { name: 'asset_url', type: 'text', label: 'Asset URL' },
    { name: 'external_url', type: 'text', label: 'External URL' },
    { name: 'image_integrity', type: 'text', label: 'Image Integrity' },
    { name: 'image_mimetype', type: 'text', label: 'Image MIME Type' },
    {
      name: 'properties',
      type: 'object',
      label: 'Properties',
      fields: [
        { name: 'creator', type: 'text', label: 'Creator' },
        { name: 'royalty', type: 'number', label: 'Royalty' },
      ],
    },
  ],
  btc_ordinals: [
    { name: 'tick', type: 'text', label: 'Tick' },
    { name: 'p', type: 'text', label: 'Protocol' },
    { name: 'op', type: 'text', label: 'Operation' },
    { name: 'amt', type: 'text', label: 'Amount' },
  ],
};
