import { fetchCodeforcesAPI } from '../api/codeforces';
import { fetchContestRatingChangesAPI } from '../api/fetchContestRatingChanges';
import { Submission } from './getParticipateVirtuals';

interface Result {
  contest: { name: string; durationSeconds: number; type: string };
  problems: { index: string; points?: number }[];
  rows: {
    party: {
      members: { handle: string }[];
      participantType: string;
      ghost: boolean;
      startTimeSeconds: number;
    };
    rank: number;
    points: number;
    penalty: number;
  }[];
}

interface Score {
  points: number;
  penalty: number;
}

export const calculateVirtualRank = async (data: {
  contestID: number;
  handle: string;
  startTime: number;
  nowTime: number;
  submissions: Submission[];
  onProgress?: (message: string) => void;
}): Promise<{
  contestName: string;
  myRank: number;
  ratingRank: number;
  endTime: number;
}> => {
  const { contestID, startTime, nowTime, submissions, onProgress } = data;
  try {
    onProgress?.(`Loading contest data...`);
    const result = await fetchCodeforcesAPI<Result>('contest.standings', {
      contestId: contestID,
    });
    const contestName = result.contest.name;
    const durationSeconds = result.contest.durationSeconds;
    if (startTime + durationSeconds > nowTime) {
      throw new Error('Not finished');
    }

    onProgress?.(`Reconstructing virtual score for ${contestName}...`);
    const myScore = calculateVirtualScore({
      contestType: result.contest.type,
      durationSeconds,
      problems: result.problems,
      submissions,
    });

    onProgress?.('Loading rating data...');
    const ratingChanges = await fetchContestRatingChangesAPI(contestID);
    onProgress?.(`Comparing virtual rank for ${contestName}...`);
    const ratedRankByHandle = new Map(
      ratingChanges.map((change) => [change.handle.toLowerCase(), change.rank])
    );

    let publicBetterCount = 0;
    let visibleRatedBetterCount = 0;
    let ratingRank = ratingChanges.length + 1;
    for (const user of result.rows) {
      if (user.rank === 0) {
        break;
      }
      const party = user.party;
      if (party.participantType !== 'CONTESTANT' || party.ghost) {
        continue;
      }

      const ratedRanks = party.members
        .map((member) => ratedRankByHandle.get(member.handle.toLowerCase()))
        .filter((rank): rank is number => rank !== undefined);
      const isRated = ratedRanks.length > 0;
      if (isBetter(user, myScore, result.contest.type)) {
        publicBetterCount += party.members.length;
        if (isRated) {
          visibleRatedBetterCount += ratedRanks.length;
        }
      } else if (isRated) {
        ratingRank = Math.min(ratingRank, ...ratedRanks);
      }
    }

    const inferredHiddenRatedBetterCount = Math.max(
      0,
      ratingRank - visibleRatedBetterCount - 1
    );

    return {
      contestName,
      myRank: publicBetterCount + inferredHiddenRatedBetterCount + 1,
      ratingRank,
      endTime: startTime + durationSeconds,
    };
  } catch (e) {
    throw e;
  }
};

const calculateVirtualScore = (data: {
  contestType: string;
  durationSeconds: number;
  problems: { index: string; points?: number }[];
  submissions: Submission[];
}) => {
  const { contestType, durationSeconds, problems, submissions } = data;
  const problemIndexToMaxPoint = new Map<string, number>();
  problems.forEach((problem, index) => {
    problemIndexToMaxPoint.set(
      problem.index,
      problem.points || (index + 1) * 500
    );
  });

  let totalPoints = 0;
  let totalPenalty = 0;
  for (const problem of problems) {
    const problemSubmissions = submissions
      .filter((submission) => {
        return (
          submission.problem.index === problem.index &&
          submission.relativeTimeSeconds >= 0 &&
          submission.relativeTimeSeconds <= durationSeconds
        );
      })
      .sort((a, b) => a.relativeTimeSeconds - b.relativeTimeSeconds);

    const wrongAttempts = countWrongAttemptsBeforeAccepted(problemSubmissions);
    const accepted = problemSubmissions.find(
      (submission) => submission.verdict === 'OK'
    );
    if (!accepted) {
      continue;
    }

    if (contestType === 'ICPC') {
      totalPoints += 1;
      totalPenalty +=
        Math.floor(accepted.relativeTimeSeconds / 60) + wrongAttempts * 10;
    } else if (contestType === 'IOI') {
      const bestPoints = Math.max(
        ...problemSubmissions.map((submission) => submission.points || 0)
      );
      totalPoints += bestPoints;
      totalPenalty = 0;
    } else {
      const maxPoint = problemIndexToMaxPoint.get(problem.index) || 500;
      const elapsedMinutes = Math.floor(accepted.relativeTimeSeconds / 60);
      const durationMinutes = Math.floor(durationSeconds / 60);
      const scoreBeforeAttempts =
        maxPoint -
        Math.floor((120 * maxPoint * elapsedMinutes) / (250 * durationMinutes));
      totalPoints += Math.max(
        maxPoint * 0.3,
        scoreBeforeAttempts - wrongAttempts * 50
      );
      totalPenalty = 0;
    }
  }

  return { points: totalPoints, penalty: totalPenalty };
};

const countWrongAttemptsBeforeAccepted = (submissions: Submission[]) => {
  let wrongAttempts = 0;
  for (const submission of submissions) {
    if (submission.verdict === 'OK') {
      return wrongAttempts;
    }
    if (isPenaltyAttempt(submission)) {
      wrongAttempts++;
    }
  }
  return wrongAttempts;
};

const isPenaltyAttempt = (submission: Submission) => {
  if (!submission.verdict) {
    return false;
  }
  if (
    submission.verdict === 'COMPILATION_ERROR' ||
    submission.verdict === 'TESTING' ||
    submission.verdict === 'SUBMITTED'
  ) {
    return false;
  }
  if (submission.verdict === 'SKIPPED' || submission.verdict === 'CHALLENGED') {
    return true;
  }
  return (submission.passedTestCount || 0) > 0;
};

const isBetter = (user: Score, mine: Score, contestType: string) => {
  if (user.points !== mine.points) {
    return user.points > mine.points;
  }
  if (contestType === 'ICPC' && user.penalty !== mine.penalty) {
    return user.penalty < mine.penalty;
  }
  return false;
};
