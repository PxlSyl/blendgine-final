import * as Effect from 'effect/Effect';

export interface RenameStoreImplementation {
  renameLayerOrTrait: (
    oldName: string,
    newName: string,
    isLayer: boolean,
    currentLayer?: string
  ) => Effect.Effect<void, Error, never>;
}
