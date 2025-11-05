import * as S from '@effect/schema/Schema';

/**
 * Schéma pour la configuration du projet
 */
export const ProjectSetupSchema = S.mutable(
  S.Struct({
    collectionName: S.String,
    collectionDescription: S.String,
    selectedFolder: S.String,
    exportFolder: S.String,
    includeRarity: S.Boolean,
    maxFrames: S.Number,
    isAnimatedCollection: S.Boolean,
    spritesheetLayout: S.optional(
      S.Struct({
        rows: S.Number,
        cols: S.Number,
        frameWidth: S.Number,
        frameHeight: S.Number,
        totalSheets: S.Number,
        framesPerSheet: S.Number,
        totalFrames: S.Number,
      })
    ),
    projectId: S.optional(S.String),
  })
);

/**
 * Schéma pour l'état de configuration du projet
 */
export const ProjectSetupStateSchema = S.mutable(
  S.Struct({
    collectionName: S.String,
    collectionDescription: S.String,
    selectedFolder: S.String,
    exportFolder: S.String,
    includeRarity: S.Boolean,
    maxFrames: S.Number,
    isAnimatedCollection: S.Boolean,
    spritesheetLayout: S.optional(
      S.Struct({
        rows: S.Number,
        cols: S.Number,
        frameWidth: S.Number,
        frameHeight: S.Number,
        totalSheets: S.Number,
        framesPerSheet: S.Number,
        totalFrames: S.Number,
      })
    ),
    projectId: S.optional(S.String),
    errorMessage: S.optional(S.String),
    showContent: S.Boolean,
  })
);

/**
 * Types inférés des schémas
 */
export type ProjectSetup = S.Schema.Type<typeof ProjectSetupSchema>;
export type ProjectSetupState = S.Schema.Type<typeof ProjectSetupStateSchema>;

/**
 * Crée l'état par défaut pour la configuration du projet
 */
export const createDefaultProjectSetupState = (): ProjectSetupState => ({
  collectionName: '',
  collectionDescription: '',
  selectedFolder: '',
  exportFolder: '',
  includeRarity: true,
  maxFrames: 1,
  isAnimatedCollection: false,
  spritesheetLayout: undefined,
  projectId: undefined,
  errorMessage: undefined,
  showContent: false,
});
