export type LanguageLevel = 1 | 2 | 3;
export type InteractionType = 1 | 2; // 1: Speaking, 2: Writing

export type UserSummaryDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentLevel?: LanguageLevel | null;
};

export type AuthResponseDto = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  refreshTokenExpiresAtUtc: string;
  user: UserSummaryDto;
};

export type RegisterRequestDto = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type RefreshRequestDto = {
  refreshToken: string;
};

export type QuestionDto = {
  id: number;
  text: string;
};

export type UpdateLevelRequestDto = {
  currentLevel: LanguageLevel;
};

export type UserLevelResponseDto = {
  userId: string;
  currentLevel?: LanguageLevel | null;
};

export type ScenarioDto = {
  id: number;
  name: string;
  difficultyLevel: LanguageLevel;
};

export type CreateSessionRequestDto = {
  scenarioId: number;
  interactionType: InteractionType;
};

export type UpdateSessionProgressRequestDto = {
  lastProgressJson?: string | null;
};

export type SessionMistakeInputDto = {
  errorType: string;
  wrongSentence: string;
  correctionText: string;
};

export type CompleteSessionRequestDto = {
  sessionId: string;
  score: number;
  summaryReport?: string | null;
  mistakes: SessionMistakeInputDto[];
};

export type SessionDto = {
  id: string;
  scenarioId: number;
  interactionType: InteractionType;
  score?: number | null;
  isCompleted: boolean;
  lastProgressJson?: string | null;
  summaryReport?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MistakeDto = {
  id: string;
  sessionId: string;
  scenarioId: number;
  scenarioName: string;
  errorType: string;
  wrongSentence: string;
  correctionText: string;
};

export type PagedResponseDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

