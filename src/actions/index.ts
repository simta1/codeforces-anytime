import { Dispatch } from 'redux';
import actionCreatorFactory from 'typescript-fsa';
import { fetchAvailableContestInfoAPI } from '../api/availableContestInfo';
import { fetchOfficialRatingRecordsAPI } from '../api/fetchOfficialRatingRecords';
import { fetchUsersAPI } from '../api/fetchUsers';
import {
  fetchProfileAPI,
  saveProfileAPI,
} from '../api/userProfile';
import AccountInfo from '../types/accountInfo';
import AvailableContestInfo from '../types/availableContestInfo';
import ContestRecord from '../types/contestRecord';
import RootState from '../types/rootState';
import UserProfile from '../types/userProfile';
import { calculateMyRating } from '../utils/calculateMyRating';
import { calculateVirtualRank } from '../utils/calculateVirtualRank';
import { getParticipateVirtuals } from '../utils/getParticipateVirtuals';

const actionCreator = actionCreatorFactory();

export const updateProfileActions = actionCreator.async<
  { id: string },
  UserProfile,
  {}
>('CreateProfile');

export const updateProfile =
  (
    userID: string,
    profile: UserProfile,
    onStart?: () => void,
    onDone?: () => void,
    onFailed?: () => void
  ) =>
  async (dispatch: Dispatch) => {
    dispatch(updateProfileActions.started({ id: userID }));
    if (onStart) {
      onStart();
    }
    try {
      await saveProfileAPI(profile);
      dispatch(
        updateProfileActions.done({ params: { id: userID }, result: profile })
      );
      if (onDone) {
        onDone();
      }
    } catch (e) {
      dispatch(
        updateProfileActions.failed({ params: { id: userID }, error: {} })
      );
      if (onFailed) {
        onFailed();
      }
    }
  };

export const updateContestRecordsActions = actionCreator.async<
  boolean,
  { lastUpdateTime: number },
  { value: Error }
>('UpdateContestRecord');

export const addContestRecordAction = actionCreator<{
  id: string;
  record: ContestRecord;
}>('AddContestRecord');

export const updateContestRecords =
  (onStart?: () => void, onDone?: () => void, onFailed?: () => void) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch(updateContestRecordsActions.started(false));
    if (onStart) {
      onStart();
    }
    const { handle, lastUpdateTime } = getState().profile;
    let oldRating = getState().profile.rating;
    let records = getState().profile.records;
    let profile = getState().profile;
    try {
      const supportedContestIDs = new Set(
        (await fetchAvailableContestInfoAPI()).map((contest) => contest.id)
      );
      const contests = await getParticipateVirtuals(handle, lastUpdateTime);
      const nowTime = Math.floor(new Date().getTime() / 1000);
      let updateTime = lastUpdateTime;
      for (const contest of contests) {
        if (!supportedContestIDs.has(contest.id)) {
          continue;
        }
        if (
          records.find(
            (record) =>
              record.contestID === contest.id &&
              record.startTime === contest.startTimeSeconds
          )
        ) {
          continue;
        }
        try {
          const { contestName, myRank, endTime } = await calculateVirtualRank({
            contestID: contest.id,
            handle,
            startTime: contest.startTimeSeconds,
            nowTime,
            submissions: contest.submissions,
          });
          const { nextRating, performance } = await calculateMyRating({
            contestID: contest.id,
            handle,
            rank: myRank,
            rating: oldRating,
          }).catch((e) => {
            return { nextRating: null, performance: null };
          });
          if (nextRating == null || performance == null) {
            continue;
          }

          const newRecord = {
            contestID: contest.id,
            startTime: contest.startTimeSeconds,
            contestName,
            rank: myRank,
            newRating: nextRating,
            oldRating,
            performance,
          };

          updateTime = Math.max(updateTime, endTime);
          records = [newRecord, ...records];
          profile = {
            ...profile,
            lastUpdateTime: updateTime,
            rating: nextRating,
            records,
          };
          await saveProfileAPI(profile);
          dispatch(addContestRecordAction({ id: handle, record: newRecord }));
          oldRating = nextRating;
        } catch (e) {
          continue;
        }
      }
      if (updateTime !== profile.lastUpdateTime) {
        profile = { ...profile, lastUpdateTime: updateTime };
        await saveProfileAPI(profile);
      }
      dispatch(
        updateContestRecordsActions.done({
          params: true,
          result: { lastUpdateTime: updateTime },
        })
      );
      if (onDone) {
        onDone();
      }
    } catch (e) {
      dispatch(
        updateContestRecordsActions.failed({
          params: true,
          error: { value: e },
        })
      );
      if (onFailed) {
        onFailed();
      }
    }
  };

export const changeAccountInfo =
  actionCreator<AccountInfo>('ChangeAccountInfo');

export const fetchProfileActions = actionCreator.async<
  {},
  UserProfile,
  { error: Error }
>('FetchProfile');

export const fetchProfile =
  (onDone?: () => void, onFailed?: () => void) =>
  async (dispatch: Dispatch) => {
    dispatch(fetchProfileActions.started({}));
    try {
      const profile = await fetchProfileAPI();
      if (profile) {
        dispatch(fetchProfileActions.done({ params: {}, result: profile }));
        if (onDone) {
          onDone();
        }
      } else {
        throw new Error('Cannot fetch');
      }
    } catch (error) {
      dispatch(fetchProfileActions.failed({ params: {}, error: { error } }));
      if (onFailed) {
        onFailed();
      }
    }
  };

export const fetchAvailableContestInfoActions = actionCreator.async<
  {},
  AvailableContestInfo[],
  { error: Error }
>('FetchAvailableContestInfo');

export const fetchAvailableContestInfo = () => async (dispatch: Dispatch) => {
  dispatch(fetchAvailableContestInfoActions.started({}));
  try {
    const contestInfoList = await fetchAvailableContestInfoAPI();

    if (contestInfoList) {
      dispatch(
        fetchAvailableContestInfoActions.done({
          params: {},
          result: contestInfoList,
        })
      );
    } else {
      throw new Error('Cannot fetch');
    }
  } catch (error) {
    dispatch(
      fetchAvailableContestInfoActions.failed({ params: {}, error: { error } })
    );
  }
};

export const fetchOfficialRatingRecordsActions = actionCreator.async<
  {},
  ContestRecord[],
  { error: Error }
>('FetchOfficialRatingInfo');

export const fetchOfficialRatingRecords =
  (handle: string) => async (dispatch: Dispatch) => {
    dispatch(fetchOfficialRatingRecordsActions.started({}));
    try {
      const officialRatingRecords = await fetchOfficialRatingRecordsAPI(handle);

      if (officialRatingRecords) {
        dispatch(
          fetchOfficialRatingRecordsActions.done({
            params: {},
            result: officialRatingRecords,
          })
        );
      } else {
        throw new Error('Cannot fetch');
      }
    } catch (error) {
      dispatch(
        fetchOfficialRatingRecordsActions.failed({
          params: {},
          error: { error },
        })
      );
    }
  };

export const fetchUsersActions = actionCreator.async<
  {},
  { [id: string]: UserProfile },
  { error: Error }
>('FetchUsersAction');

export const fetchUsers =
  (
    onDone?: (users: { [id: string]: UserProfile }) => void,
    onFailed?: () => void
  ) =>
  async (dispatch: Dispatch) => {
    dispatch(fetchUsersActions.started({}));
    try {
      const users = await fetchUsersAPI();

      if (users) {
        dispatch(
          fetchUsersActions.done({
            params: {},
            result: users,
          })
        );
        if (onDone) {
          onDone(users);
        }
      } else {
        throw new Error('Cannot fetch');
      }
    } catch (error) {
      dispatch(fetchUsersActions.failed({ params: {}, error: { error } }));
      if (onFailed) {
        onFailed();
      }
    }
  };
