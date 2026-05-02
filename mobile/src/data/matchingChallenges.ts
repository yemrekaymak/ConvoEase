import type { DifficultyLevel, MatchingItem } from '../types/miniGames';
import { VOCABULARY_ITEMS } from './vocabulary';

export const MATCHING_ITEMS: MatchingItem[] = VOCABULARY_ITEMS.map((item) => ({
  id: item.id.replace('vocab', 'match'),
  promptKey: item.promptKey,
  difficultyLevel: item.difficultyLevel,
  english: item.word,
  turkish: item.translation,
}));

export function getMatchingItems(promptKey: string, difficultyLevel: DifficultyLevel) {
  return MATCHING_ITEMS.filter(
    (item) => item.promptKey === promptKey && item.difficultyLevel === difficultyLevel
  );
}
