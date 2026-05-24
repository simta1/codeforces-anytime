import ContestRecord from '../types/contestRecord';
import { fetchCodeforcesAPI } from './codeforces';

export const fetchOfficialRatingRecordsAPI = async (handle: string) => {
  try {
    const result = await fetchCodeforcesAPI<any[]>('user.rating', { handle });
    const records: ContestRecord[] = [];
    for (const record of result) {
      records.push({ ...record, contestID: record.contestId });
    }
    return records;
  } catch (e) {
    return e;
  }
};
