import { fetchCodeforcesAPI } from './codeforces';

export interface CodeforcesUserInfo {
  handle: string;
  rating?: number;
  registrationTimeSeconds?: number;
}

const isHandleNotFoundError = (error: unknown) => {
  return error instanceof Error && /not found/i.test(error.message);
};

export const fetchUserInfo = async (
  handle: string
): Promise<CodeforcesUserInfo | null> => {
  try {
    const result = await fetchCodeforcesAPI<CodeforcesUserInfo[]>('user.info', {
      handles: handle,
    });
    const user = result[0];
    if (!user || user.handle.toLowerCase() !== handle.toLowerCase()) {
      return null;
    }
    return user;
  } catch (e) {
    if (!isHandleNotFoundError(e)) {
      throw e;
    }
    return null;
  }
};

export const fetchRealRating = async (handle: string): Promise<number> => {
  const user = await fetchUserInfo(handle);
  if (!user) {
    return -1;
  }
  return user.rating || 1500;
};
