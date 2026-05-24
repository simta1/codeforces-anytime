import UserProfile from '../types/userProfile';
import { fetchAvailableContestInfoAPI } from './availableContestInfo';
import { fetchUserInfo } from './fetchRealRating';
import { fetchCodeforcesAPI } from './codeforces';
import { getParticipateVirtuals } from '../utils/getParticipateVirtuals';

interface CodeforcesRatingChange {
  newRating: number;
  ratingUpdateTimeSeconds: number;
}

export interface InitialRatingData {
  rating: number;
  startTime: number;
  reason: string;
}

export interface RemoveSavedProfileResult {
  savedHandles: string[];
  activeHandle: string;
}

export type ProfileCreationProgress = (message: string) => void;

const dateStringFromSeconds = (time: number) =>
  new Date(time * 1000).toISOString().slice(0, 10);

const profileStorageKey = (handle: string) =>
  `codeforces-anytime.profile.${handle.toLowerCase()}`;
const activeHandleStorageKey = 'codeforces-anytime.handle';
const savedHandlesStorageKey = 'codeforces-anytime.handles';

export const getActiveHandle = () => {
  return window.localStorage.getItem(activeHandleStorageKey) || '';
};

export const setActiveHandle = (handle: string) => {
  window.localStorage.setItem(activeHandleStorageKey, handle);
};

export const fetchSelectedHandle = async () => {
  return getActiveHandle();
};

export const getSavedHandles = () => {
  const rawHandles = window.localStorage.getItem(savedHandlesStorageKey);
  if (!rawHandles) {
    return [];
  }
  try {
    return JSON.parse(rawHandles) as string[];
  } catch (e) {
    return [];
  }
};

export const getSavedProfile = (handle: string) => {
  const savedProfile = window.localStorage.getItem(profileStorageKey(handle));
  if (!savedProfile) {
    return null;
  }
  try {
    return JSON.parse(savedProfile) as UserProfile;
  } catch (e) {
    return null;
  }
};

const saveHandleToList = (handle: string) => {
  const handles = getSavedHandles();
  const nextHandles = [
    handle,
    ...handles.filter(
      (savedHandle) => savedHandle.toLowerCase() !== handle.toLowerCase()
    ),
  ];
  window.localStorage.setItem(
    savedHandlesStorageKey,
    JSON.stringify(nextHandles)
  );
};

export const saveProfileAPI = async (profile: UserProfile) => {
  setActiveHandle(profile.handle);
  saveHandleToList(profile.handle);
  window.localStorage.setItem(
    profileStorageKey(profile.handle),
    JSON.stringify(profile)
  );
};

export const removeSavedProfileAPI = (
  handle: string
): RemoveSavedProfileResult => {
  const lowerHandle = handle.toLowerCase();
  const nextHandles = getSavedHandles().filter(
    (savedHandle) => savedHandle.toLowerCase() !== lowerHandle
  );
  window.localStorage.setItem(
    savedHandlesStorageKey,
    JSON.stringify(nextHandles)
  );
  window.localStorage.removeItem(profileStorageKey(handle));

  const activeHandle = getActiveHandle();
  let nextActiveHandle = activeHandle;
  if (activeHandle.toLowerCase() === lowerHandle) {
    nextActiveHandle = nextHandles[0] || '';
    if (nextActiveHandle) {
      setActiveHandle(nextActiveHandle);
    } else {
      window.localStorage.removeItem(activeHandleStorageKey);
    }
  }

  return {
    savedHandles: nextHandles,
    activeHandle: nextActiveHandle,
  };
};

const getInitialRatingData = async (
  handle: string,
  registrationTime: number,
  onProgress?: ProfileCreationProgress
): Promise<InitialRatingData> => {
  onProgress?.('Loading virtual contest submissions...');
  const virtuals = await getParticipateVirtuals(
    handle,
    registrationTime,
    ({ loadedSubmissions, oldestSubmissionTime }) => {
      const oldestText = oldestSubmissionTime
        ? `, reached ${dateStringFromSeconds(oldestSubmissionTime)}`
        : '';
      onProgress?.(
        `Loading virtual contest submissions... ${loadedSubmissions} loaded${oldestText}`
      );
    }
  );
  onProgress?.('Loading supported contest list...');
  const supportedContests = await fetchAvailableContestInfoAPI();
  const supportedContestByID = new Map(
    supportedContests.map((contest) => [contest.id, contest])
  );
  const firstSupportedVirtual = virtuals.find((virtual) =>
    supportedContestByID.has(virtual.id)
  );
  if (!firstSupportedVirtual) {
    return {
      rating: 1500,
      startTime: registrationTime,
      reason:
        'No supported virtual contest history was found, so the local rating starts at 1500.',
    };
  }

  onProgress?.('Loading official rating history...');
  const firstVirtualStartTime = firstSupportedVirtual.startTimeSeconds;
  const firstVirtualContest = supportedContestByID.get(
    firstSupportedVirtual.id
  );
  const firstVirtualDescription = firstVirtualContest
    ? `${firstVirtualContest.name} on ${dateStringFromSeconds(
        firstVirtualStartTime
      )}`
    : `contest ${firstSupportedVirtual.id} on ${dateStringFromSeconds(
        firstVirtualStartTime
      )}`;
  const officialRatings = await fetchCodeforcesAPI<CodeforcesRatingChange[]>(
    'user.rating',
    { handle }
  );
  officialRatings.sort(
    (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds
  );

  let rating = 1500;
  let hasRatingBeforeFirstVirtual = false;
  for (const record of officialRatings) {
    if (record.ratingUpdateTimeSeconds >= firstVirtualStartTime) {
      break;
    }
    rating = record.newRating;
    hasRatingBeforeFirstVirtual = true;
  }

  return {
    rating,
    startTime: firstVirtualStartTime,
    reason: hasRatingBeforeFirstVirtual
      ? `This is your official Codeforces rating just before your first supported virtual contest (${firstVirtualDescription}).`
      : `Your first supported virtual contest was ${firstVirtualDescription}, but no official Codeforces rating update existed before it, so the local rating starts at 1500.`,
  };
};

export const createInitialProfile = async (
  handle: string,
  onProgress?: ProfileCreationProgress
): Promise<UserProfile> => {
  onProgress?.('Checking Codeforces handle...');
  const user = await fetchUserInfo(handle);
  if (!user) {
    throw new Error('Invalid handle');
  }
  const registrationTime = user.registrationTimeSeconds || 0;
  const { rating, startTime, reason } = await getInitialRatingData(
    user.handle,
    registrationTime,
    onProgress
  );

  onProgress?.('Preparing local profile...');
  return {
    handle: user.handle,
    lastUpdateTime: startTime,
    rating,
    records: [
      {
        contestID: 0,
        contestName: 'Registration',
        oldRating: 0,
        newRating: rating,
        rank: 1,
        startTime,
        performance: 0,
      },
    ],
    registrationTime,
    initialRatingReason: reason,
  };
};

export const fetchProfileAPI = async () => {
  try {
    const handle = await fetchSelectedHandle();
    if (!handle) {
      return undefined;
    }

    const savedProfile = getSavedProfile(handle);
    if (savedProfile) {
      return savedProfile;
    }

    const profile = await createInitialProfile(handle);
    await saveProfileAPI(profile);
    return profile;
  } catch (e) {
    return undefined;
  }
};
