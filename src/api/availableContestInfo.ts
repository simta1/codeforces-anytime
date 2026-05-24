import AvailableContestInfo from '../types/availableContestInfo';
import { fetchCodeforcesAPI } from './codeforces';

interface CodeforcesContest {
  id: number;
  name: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
  type: string;
}

interface CachedAvailableContestInfo {
  updatedAt: number;
  contests: AvailableContestInfo[];
}

const cacheKey = 'codeforces-anytime.available-contests';
const cacheTTL = 6 * 60 * 60 * 1000;

const readCache = () => {
  const rawCache = window.localStorage.getItem(cacheKey);
  if (!rawCache) {
    return null;
  }
  try {
    return JSON.parse(rawCache) as CachedAvailableContestInfo;
  } catch (e) {
    return null;
  }
};

const writeCache = (contests: AvailableContestInfo[]) => {
  window.localStorage.setItem(
    cacheKey,
    JSON.stringify({ updatedAt: Date.now(), contests })
  );
};

export const fetchAvailableContestInfoAPI = async () => {
  const cached = readCache();
  if (cached && Date.now() - cached.updatedAt < cacheTTL) {
    return cached.contests;
  }

  try {
    const contests = await fetchCodeforcesAPI<CodeforcesContest[]>(
      'contest.list'
    );
    const data: AvailableContestInfo[] = contests
      .filter((contest) => {
        return (
          contest.phase === 'FINISHED' &&
          contest.startTimeSeconds !== undefined &&
          contest.id >= 670 &&
          contest.type !== 'IOI'
        );
      })
      .map((contest) => ({
        id: contest.id,
        name: contest.name,
        durationSeconds: contest.durationSeconds,
        startTimeSeconds: contest.startTimeSeconds as number,
      }));

    data.sort((a, b) => {
      if (a.startTimeSeconds < b.startTimeSeconds) {
        return 1;
      }
      if (a.startTimeSeconds > b.startTimeSeconds) {
        return -1;
      }
      return 0;
    });

    writeCache(data);
    return data;
  } catch (e) {
    if (cached) {
      return cached.contests;
    }
    throw e;
  }
};
