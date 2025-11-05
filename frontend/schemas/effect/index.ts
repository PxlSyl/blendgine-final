// Export tous les schémas nécessaires pour correspondre exactement à la structure du fichier types/zod.ts

// Export des schémas de projectSetup
export { ProjectSetupSchema, ProjectSetupStateSchema } from './projectSetup';

// Export SpritesheetLayoutSchema depuis layerOrder
export { SpritesheetLayoutSchema } from './layerOrder';

// Export des schémas de prévisualisation et de configuration d'image
export {
  BlendPropertiesSchema as PreviewBlendPropertiesSchema,
  LayerImageInfoSchema,
  DimensionsSchema,
  LayerImagesSchema,
  ImageEntrySchema,
  LayerPreviewStateSchema,
  LayerPreviewDataSchema,

  // Schémas de configuration d'image
  ImageSetupPersistentStateSchema,
  ImageSetupStateSchema,
} from './projectSetup/previews';

// Export schémas auth
export { UserSchema, AuthStateSchema, AppStateSchema, GenerationStateSchema } from './auth';

// Export schémas filters (conservés pour compatibilité types)
// Les schémas FilterInstance, FilterOptions, etc. sont conservés car utilisés dans la génération

// Export schémas de gaming
export { DataGamingStateSchema, GameAttributeSchema, GameHeaderSchema } from './games';

// Export schémas layerOrder
export * from './layerOrder';

// Export schémas generatePreview
export * from './layerOrder/generatePreviewStore';

// Export schémas renameStore
export * from './projectSetup/renameStore';

// Export schémas rarityStore
export * from './rarityStore';

// Export schémas rulesStore
export * from './rulesStore';
