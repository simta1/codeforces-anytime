import { fetchCodeforcesAPI } from '../api/codeforces';

export interface Submission {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    points?: number;
  };
  author: {
    participantType: string;
    startTimeSeconds: number;
  };
  verdict?: string;
  testset?: string;
  passedTestCount?: number;
  points?: number;
}

export interface ContestInfo {
  id: number;
  startTimeSeconds: number;
  submissions: Submission[];
}

export interface SubmissionFetchProgress {
  loadedSubmissions: number;
  oldestSubmissionTime?: number;
}

export const getParticipateVirtuals = async (
  handle: string,
  lastUpdateTime: number,
  onProgress?: (progress: SubmissionFetchProgress) => void
): Promise<ContestInfo[]> => {
  const submissions = await fetchRecentSubmissions(
    handle,
    lastUpdateTime,
    onProgress
  );
  const contestByKey = new Map<string, ContestInfo>();
  const virtuals = new Array<ContestInfo>();
  for (const submission of submissions) {
    if (
      !submission.contestId ||
      submission.author.participantType !== 'VIRTUAL' ||
      submission.author.startTimeSeconds < lastUpdateTime
    ) {
      continue;
    }

    const key = `${submission.contestId}:${submission.author.startTimeSeconds}`;
    if (!contestByKey.has(key)) {
      const contest = {
        id: submission.contestId,
        startTimeSeconds: submission.author.startTimeSeconds,
        submissions: [],
      };
      contestByKey.set(key, contest);
      virtuals.push(contest);
    }
    contestByKey.get(key)?.submissions.push(submission);
  }
  return virtuals.reverse();
};

const fetchRecentSubmissions = async (
  handle: string,
  lastUpdateTime: number,
  onProgress?: (progress: SubmissionFetchProgress) => void
) => {
  const pageSize = 100;
  const submissions = new Array<Submission>();
  let from = 1;

  while (true) {
    const page = await fetchCodeforcesAPI<Submission[]>('user.status', {
      handle,
      from,
      count: pageSize,
    });
    submissions.push(...page);
    const oldestSubmissionTime =
      page.length > 0
        ? Math.min(
            ...page.map((submission) => submission.creationTimeSeconds || 0)
          )
        : undefined;
    onProgress?.({
      loadedSubmissions: submissions.length,
      oldestSubmissionTime,
    });

    if (
      page.length < pageSize ||
      page.some((submission) => submission.creationTimeSeconds < lastUpdateTime)
    ) {
      break;
    }

    from += pageSize;
  }

  return submissions;
};
