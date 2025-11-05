import * as S from '@effect/schema/Schema';

/**
 * Schéma Effect pour l'utilisateur
 */
export const UserSchema = S.Struct({
  email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: S.optional(S.String),
});

/**
 * Schéma Effect pour l'état d'authentification
 */
export const AuthStateSchema = S.Struct({
  isAuthenticated: S.Boolean,
  user: S.Union(UserSchema, S.Null),
  loading: S.Boolean,
  error: S.Union(S.String, S.Null),
});

/**
 * Schéma pour l'état de génération
 */
export const GenerationStateSchema = S.Struct({
  status: S.Union(
    S.Literal('idle'),
    S.Literal('generating'),
    S.Literal('completed'),
    S.Literal('cancelled'),
    S.Literal('error')
  ),
  error: S.Union(S.String, S.Null),
});

/**
 * Schéma pour l'état global de l'application
 */
export const AppStateSchema = S.Struct({
  showDots: S.Boolean,
  showConfetti: S.Boolean,
  showMenu: S.Boolean,
  generationState: GenerationStateSchema,
  isCancelled: S.Boolean,
  currentMode: S.Union(S.Literal('generation'), S.Literal('filters')),
  isApplyingFilters: S.Boolean,
  filterState: S.Union(
    S.Literal('idle'),
    S.Literal('applying'),
    S.Literal('success'),
    S.Literal('error')
  ),
  isMixComplete: S.Boolean,
  showSuccessScreen: S.Boolean,
});

/**
 * Types inférés à partir des schémas
 */
export type User = S.Schema.Type<typeof UserSchema>;
export type AuthState = S.Schema.Type<typeof AuthStateSchema>;
export type GenerationState = S.Schema.Type<typeof GenerationStateSchema>;
export type AppState = S.Schema.Type<typeof AppStateSchema>;

/**
 * Crée l'état par défaut pour l'authentification
 */
export const createDefaultAuthState = (): AuthState => ({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
});

/**
 * Crée l'état par défaut pour la génération
 */
export const createDefaultGenerationState = (): GenerationState => ({
  status: 'idle',
  error: null,
});

/**
 * Crée l'état par défaut pour l'application
 */
export const createDefaultAppState = (): AppState => ({
  showDots: false,
  showConfetti: false,
  showMenu: true,
  generationState: createDefaultGenerationState(),
  isCancelled: false,
  currentMode: 'generation',
  isApplyingFilters: false,
  filterState: 'idle',
  isMixComplete: false,
  showSuccessScreen: false,
});
