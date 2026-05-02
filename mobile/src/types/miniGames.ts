export type DifficultyLevel = 1 | 2 | 3;

export type VocabularyItem = {
  id: string;
  promptKey: string;
  difficultyLevel: DifficultyLevel;
  word: string;
  translation: string;
  partOfSpeech?: string;
  exampleSentence: string;
  exampleTranslation: string;
};

export type SentenceChallengeItem = {
  id: string;
  promptKey: string;
  difficultyLevel: DifficultyLevel;
  sentence: string;
  translation: string;
  note: string;
  hint: string;
};

export type MatchingItem = {
  id: string;
  promptKey: string;
  difficultyLevel: DifficultyLevel;
  english: string;
  turkish: string;
};

export type PronunciationAttempt = {
  transcript: string;
  expectedSentence: string;
  score: number;
  status: 'Excellent' | 'Good' | 'Almost there' | 'Try again';
};

export type MiniGameReviewType = 'sentence_builder' | 'word_matching' | 'pronunciation';

export type MiniGameReviewItem = {
  id: string;
  type: MiniGameReviewType;
  scenarioId: number;
  scenarioTitle: string;
  promptKey: string;
  difficultyLabel: string;
  title: string;
  wrongAnswer: string;
  correction: string;
  note?: string;
  createdAt: string;
};

export type MiniGameProgressSnapshot = {
  totalXp: number;
  stars: number;
  completedCount: number;
  needsReviewCount: number;
};
