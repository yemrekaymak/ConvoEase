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
  category: string;
  passageTitle?: string | null;
  passageText?: string | null;
  options: QuestionOptionDto[];
};

export type QuestionOptionDto = {
  key: string;
  text: string;
};

export type SubmitPlacementTestRequestDto = {
  answers: PlacementAnswerDto[];
};

export type PlacementAnswerDto = {
  questionId: number;
  selectedOption: string;
};

export type PlacementTestResultDto = {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  scorePercentage: number;
  recommendedLevel: LanguageLevel;
  recommendedLevelLabel: string;
};

export type ScenarioDto = {
  id: number;
  groupKey: string;
  groupName: string;
  name: string;
  promptKey: string;
  difficultyLevel: LanguageLevel;
  orderIndex: number;
  isUnlocked: boolean;
  isCompleted: boolean;
};

export type ScenarioItemDto = {
  id: number;
  name: string;
  promptKey: string;
  difficultyLevel: LanguageLevel;
  orderIndex: number;
  isUnlocked: boolean;
  isCompleted: boolean;
};

export type ScenarioGroupDto = {
  key: string;
  name: string;
  items: ScenarioItemDto[];
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

export type ConversationStartRequestDto = {
  scenarioId: number;
  interactionType: InteractionType;
};

export type ConversationStartResponseDto = {
  sessionId: string;
  scenarioId: number;
  scenarioName: string;
  interactionType: InteractionType;
  initialMessage: string;
  sessionStateJson: string;
};

export type ConversationMessageRequestDto = {
  message: string;
};

export type ConversationFeedbackDto = {
  turn: number;
  score: number;
  encouragement?: string | null;
  writingFeedback?: string | null;
  errors: ConversationFeedbackErrorDto[];
};

export type ConversationFeedbackErrorDto = {
  type: string;
  wrongSentence: string;
  correctionText: string;
  whyWrong?: string | null;
  teachingTip?: string | null;
};

export type ConversationMessageResponseDto = {
  sessionId: string;
  transcript: string;
  characterMessage?: string | null;
  feedback: ConversationFeedbackDto;
};

export type ConversationTranscriptResponseDto = {
  sessionId: string;
  transcript: string;
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
  whyWrong?: string | null;
  teachingTip?: string | null;
};

export type SessionReportDto = {
  sessionId: string;
  scenarioId: number;
  scenarioName: string;
  interactionType: InteractionType;
  score?: number | null;
  summaryReport?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  mistakes: MistakeDto[];
};

export type PagedResponseDto<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
};

