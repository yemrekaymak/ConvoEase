import type { Difficulty, ScenarioId } from '../constants/scenarios';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Chat: {
    scenarioId: ScenarioId;
    scenarioTitle: string;
    difficulty: Difficulty;
    difficultyLabel: string;
  };
  Summary: {
    scenarioTitle: string;
    difficultyLabel: string;
  };
};
