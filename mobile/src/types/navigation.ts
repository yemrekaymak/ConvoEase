export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Placement: undefined;
  Home: undefined;
  Chat: {
    scenarioId: number;
    scenarioTitle: string;
    difficultyLabel: string;
  };
  Summary: {
    scenarioTitle: string;
    difficultyLabel: string;
  };
  Mistakes: undefined;
};
