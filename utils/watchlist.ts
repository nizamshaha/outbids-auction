'use client';

const WATCHLIST_STORAGE_KEY = 'outbids_watchlist_ids';
const RANK_HISTORY_STORAGE_KEY = 'outbids_rank_snapshot';

export type RankDeltaType = 'up' | 'down' | 'same' | 'new';

export interface RankDeltaInfo {
  type: RankDeltaType;
  delta: number;
  label: string;
}

/**
 * Retrieve saved watchlist bid IDs from localStorage
 */
export function getWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggle bookmark state of a bid ID
 */
export function toggleWatchlist(bidId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getWatchlist();
    const exists = list.includes(bidId);
    const updated = exists ? list.filter((id) => id !== bidId) : [...list, bidId];
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

/**
 * Check if a bid is currently bookmarked
 */
export function isWatchlisted(bidId: string): boolean {
  if (typeof window === 'undefined') return false;
  const list = getWatchlist();
  return list.includes(bidId);
}

/**
 * Retrieve previous rank snapshots
 */
export function getRankHistory(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RANK_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Compute rank delta comparing previous rank against current rank
 */
export function getRankDelta(bidId: string, currentRank: number): RankDeltaInfo {
  if (typeof window === 'undefined') {
    return { type: 'same', delta: 0, label: '-' };
  }

  const history = getRankHistory();
  const previousRank = history[bidId];

  if (typeof previousRank !== 'number') {
    return { type: 'new', delta: 0, label: 'NEW' };
  }

  if (previousRank > currentRank) {
    const diff = previousRank - currentRank;
    return { type: 'up', delta: diff, label: `↑ ${diff}` };
  }

  if (previousRank < currentRank) {
    const diff = currentRank - previousRank;
    return { type: 'down', delta: diff, label: `↓ ${diff}` };
  }

  return { type: 'same', delta: 0, label: '-' };
}

/**
 * Save current ranks snapshot to localStorage for delta comparison on next visit
 */
export function saveRankSnapshot(rankedBids: { id: string; rank: number }[]): void {
  if (typeof window === 'undefined' || !rankedBids.length) return;
  try {
    const history = getRankHistory();
    const updated: Record<string, number> = { ...history };

    rankedBids.forEach(({ id, rank }) => {
      updated[id] = rank;
    });

    localStorage.setItem(RANK_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
