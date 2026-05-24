import { fetchCodeforcesAPI } from './codeforces';

export interface CodeforcesRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

const cache = new Map<number, Promise<CodeforcesRatingChange[]>>();

export const fetchContestRatingChangesAPI = (contestID: number) => {
  if (!cache.has(contestID)) {
    cache.set(
      contestID,
      fetchCodeforcesAPI<CodeforcesRatingChange[]>('contest.ratingChanges', {
        contestId: contestID,
      })
    );
  }
  return cache.get(contestID) as Promise<CodeforcesRatingChange[]>;
};
