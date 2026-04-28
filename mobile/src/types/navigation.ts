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
  };
  Mistakes: undefined;
};
