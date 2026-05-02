import * as SecureStore from 'expo-secure-store';
import type { MiniGameProgressSnapshot, MiniGameReviewItem } from '../types/miniGames';

const MINI_GAME_REVIEW_KEY = 'convoease.minigame.review.v1';
const MINI_GAME_PROGRESS_KEY = 'convoease.minigame.progress.v1';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getMiniGameReviews() {
  return readJson<MiniGameReviewItem[]>(MINI_GAME_REVIEW_KEY, []);
}

export async function addMiniGameReview(item: MiniGameReviewItem) {
  const current = await getMiniGameReviews();
  const next = [item, ...current].slice(0, 80);
  await writeJson(MINI_GAME_REVIEW_KEY, next);
}

export async function getMiniGameProgress() {
  return readJson<MiniGameProgressSnapshot>(MINI_GAME_PROGRESS_KEY, {
    totalXp: 0,
    stars: 0,
    completedCount: 0,
    needsReviewCount: 0,
  });
}

export async function awardMiniGameProgress(input: {
  xp: number;
  stars?: number;
  completed?: boolean;
  needsReview?: boolean;
}) {
  const current = await getMiniGameProgress();
  const next = {
    totalXp: current.totalXp + input.xp,
    stars: current.stars + (input.stars ?? 0),
    completedCount: current.completedCount + (input.completed ? 1 : 0),
    needsReviewCount: current.needsReviewCount + (input.needsReview ? 1 : 0),
  };
  await writeJson(MINI_GAME_PROGRESS_KEY, next);
  return next;
}
