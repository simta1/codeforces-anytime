import { fetchCodeforcesAPI } from '../api/codeforces';
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
}): Promise<{ contestName: string; myRank: number; endTime: number }> => {
  const { contestID, startTime, nowTime, submissions } = data;
  try {
    const result = await fetchCodeforcesAPI<Result>('contest.standings', {
      contestId: contestID,
    });
    const contestName = result.contest.name;
    const durationSeconds = result.contest.durationSeconds;
    if (startTime + durationSeconds > nowTime) {
      throw new Error('Not finished');
    }

    const myScore = calculateVirtualScore({
      contestType: result.contest.type,
      durationSeconds,
      problems: result.problems,
      submissions,
    });

    let cnt = 0;
    for (const user of result.rows) {
      if (user.rank === 0) {
        break;
      }
      const party = user.party;
      if (party.participantType !== 'CONTESTANT' || party.ghost) {
        continue;
      }

      if (isBetter(user, myScore, result.contest.type)) {
        cnt += party.members.length;
      }
    }
    return {
      contestName,
      myRank: cnt + 1,
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
