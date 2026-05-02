import type { SentenceChallengeItem } from '../types/miniGames';

export function shuffleArray<T>(items: T[]) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function splitSentenceTokens(sentence: string) {
  return sentence.trim().split(/\s+/);
}

export function normalizeSentence(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSentenceCorrect(expected: string, attempt: string) {
  return normalizeSentence(expected) === normalizeSentence(attempt);
}

export function getHintTokenIndex(challenge: SentenceChallengeItem, builtTokens: string[]) {
  const expected = splitSentenceTokens(challenge.sentence);
  for (let i = 0; i < expected.length; i += 1) {
    if ((builtTokens[i] ?? '') !== expected[i]) {
      return i;
    }
  }
  return -1;
}
