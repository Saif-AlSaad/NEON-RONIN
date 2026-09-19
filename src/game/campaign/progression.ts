import { getCheckpointForLevel } from "./levels";

export interface LevelRecord {
  stars: number; // 1 to 3 stars
  bestScore: number;
  bestTime: number; // in seconds
  clearedAt: number; // timestamp
}

export interface CampaignState {
  highestUnlockedLevel: number;
  currentSelectedLevel: number;
  completedLevels: Record<number, LevelRecord>;
  unlockedCheckpoints: number[];
  claimedFirstClearRewards: number[];
}

const CAMPAIGN_STORAGE_KEY = "nr_campaign_progression_v1";

const DEFAULT_CAMPAIGN_STATE: CampaignState = {
  highestUnlockedLevel: 1,
  currentSelectedLevel: 1,
  completedLevels: {},
  unlockedCheckpoints: [1],
  claimedFirstClearRewards: [],
};

/**
 * Loads campaign progression from localStorage with safe fallback.
 */
export function loadCampaignProgress(): CampaignState {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state: CampaignState = {
        highestUnlockedLevel: Math.max(1, Math.min(100, parsed.highestUnlockedLevel ?? 1)),
        currentSelectedLevel: Math.max(1, Math.min(100, parsed.currentSelectedLevel ?? 1)),
        completedLevels: parsed.completedLevels ?? {},
        unlockedCheckpoints: Array.isArray(parsed.unlockedCheckpoints) && parsed.unlockedCheckpoints.length > 0
          ? parsed.unlockedCheckpoints
          : [1],
        claimedFirstClearRewards: Array.isArray(parsed.claimedFirstClearRewards)
          ? parsed.claimedFirstClearRewards
          : [],
      };
      return state;
    }
  } catch (err) {
    console.error("Failed to load campaign progression:", err);
  }
  return { ...DEFAULT_CAMPAIGN_STATE };
}

/**
 * Persists campaign progression to localStorage.
 */
export function saveCampaignProgress(state: CampaignState): void {
  try {
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save campaign progression:", err);
  }
}

/**
 * Checks if a specific level is currently unlocked and playable.
 */
export function canAccessLevel(level: number, state?: CampaignState): boolean {
  const current = state ?? loadCampaignProgress();
  return level >= 1 && level <= current.highestUnlockedLevel;
}

/**
 * Records completion of a level, unlocks the next level, and updates checkpoints.
 */
export function recordLevelCompletion(
  level: number,
  score: number,
  timeSeconds: number,
  stars: number = 3
): {
  nextLevel: number;
  isNewUnlock: boolean;
  newCheckpointUnlocked: boolean;
  state: CampaignState;
} {
  const state = loadCampaignProgress();
  const clampedLevel = Math.max(1, Math.min(100, Math.floor(level)));

  const existingRecord = state.completedLevels[clampedLevel];
  const isFirstClear = !existingRecord;

  // Update level record with highest star, highest score, fastest time
  state.completedLevels[clampedLevel] = {
    stars: Math.max(existingRecord?.stars ?? 0, Math.min(3, Math.max(1, stars))),
    bestScore: Math.max(existingRecord?.bestScore ?? 0, score),
    bestTime: existingRecord?.bestTime ? Math.min(existingRecord.bestTime, timeSeconds) : timeSeconds,
    clearedAt: Date.now(),
  };

  let isNewUnlock = false;
  let newCheckpointUnlocked = false;

  const nextLevel = Math.min(100, clampedLevel + 1);
  if (nextLevel > state.highestUnlockedLevel) {
    state.highestUnlockedLevel = nextLevel;
    isNewUnlock = true;
  }

  // Check if a new sector checkpoint has been unlocked
  const checkpoint = getCheckpointForLevel(nextLevel);
  if (!state.unlockedCheckpoints.includes(checkpoint)) {
    state.unlockedCheckpoints.push(checkpoint);
    state.unlockedCheckpoints.sort((a, b) => a - b);
    newCheckpointUnlocked = true;
  }

  state.currentSelectedLevel = nextLevel;
  saveCampaignProgress(state);

  return {
    nextLevel,
    isNewUnlock,
    newCheckpointUnlocked,
    state,
  };
}

/**
 * Sets the current selected level for campaign launch.
 */
export function setSelectedLevel(level: number): boolean {
  const state = loadCampaignProgress();
  if (canAccessLevel(level, state)) {
    state.currentSelectedLevel = level;
    saveCampaignProgress(state);
    return true;
  }
  return false;
}

/**
 * Resets campaign progression back to default level 1 state.
 */
export function resetCampaignProgress(): CampaignState {
  const resetState: CampaignState = {
    highestUnlockedLevel: 1,
    currentSelectedLevel: 1,
    completedLevels: {},
    unlockedCheckpoints: [1],
    claimedFirstClearRewards: [],
  };
  saveCampaignProgress(resetState);
  return resetState;
}
