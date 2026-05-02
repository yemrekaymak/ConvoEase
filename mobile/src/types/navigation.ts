import type { MistakeDto } from '../api/types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Placement: undefined;
  Home: undefined;
  ScenarioGroup: {
    groupKey: string;
    groupName: string;
  };
  Chat: {
    scenarioId: number;
    scenarioTitle: string;
    difficultyLabel: string;
    interactionType: 1 | 2;
    interactionLabel: string;
  };
  Summary: {
    scenarioTitle: string;
    difficultyLabel: string;
    interactionLabel: string;
    score?: number | null;
    summaryReport?: string | null;
    mistakeCount?: number;
    mistakes?: MistakeDto[];
  };
  Mistakes: undefined;
  ScenarioDictionary: {
    scenarioId: number;
    scenarioTitle: string;
    promptKey: string;
    difficultyLevel: 1 | 2 | 3;
    difficultyLabel: string;
  };
  SentenceBuilder: {
    scenarioId: number;
    scenarioTitle: string;
    promptKey: string;
    difficultyLevel: 1 | 2 | 3;
    difficultyLabel: string;
  };
  WordMatching: {
    scenarioId: number;
    scenarioTitle: string;
    promptKey: string;
    difficultyLevel: 1 | 2 | 3;
    difficultyLabel: string;
  };
  PronunciationPractice: {
    scenarioId: number;
    scenarioTitle: string;
    promptKey: string;
    difficultyLevel: 1 | 2 | 3;
    difficultyLabel: string;
    sentence: string;
    translation: string;
  };
};
