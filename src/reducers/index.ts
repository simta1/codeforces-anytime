import { combineReducers } from 'redux';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import {
  addContestRecordAction,
  changeAccountInfo,
  changeRatingUpdateMessage,
  fetchAvailableContestInfoActions,
  fetchOfficialRatingRecordsActions,
  fetchProfileActions,
  fetchUsersActions,
  updateContestRecordsActions,
  updateProfileActions,
} from '../actions';
import AccountInfo from '../types/accountInfo';
import AvailableContestInfo from '../types/availableContestInfo';
import ContestRecord from '../types/contestRecord';
import RootState from '../types/rootState';
import UserProfile from '../types/userProfile';

const contestRecordKey = (record: ContestRecord) =>
  `${record.contestID}:${record.startTime}`;

const addContestRecord = (records: ContestRecord[], record: ContestRecord) => {
  if (
    records.some((item) => contestRecordKey(item) === contestRecordKey(record))
  ) {
    return records;
  }
  return [record, ...records].sort((a, b) => {
    if (a.startTime !== b.startTime) {
      return b.startTime - a.startTime;
    }
    if (a.contestID === 0 && b.contestID !== 0) {
      return 1;
    }
    if (b.contestID === 0 && a.contestID !== 0) {
      return -1;
    }
    return b.contestID - a.contestID;
  });
};

const profileReducer = reducerWithInitialState<UserProfile>({
  handle: '',
  lastUpdateTime: 0,
  rating: 0,
  records: [],
  registrationTime: 0,
})
  .case(updateProfileActions.done, (prev, payload) => payload.result)
  .case(fetchProfileActions.done, (prev, payload) => payload.result)
  .case(addContestRecordAction, (prev, payload) => {
    if (prev.handle.toLowerCase() !== payload.id.toLowerCase()) {
      return prev;
    }
    const records = addContestRecord(prev.records, payload.record);
    const rating = payload.record.newRating;
    return { ...prev, rating, records };
  })
  .case(updateContestRecordsActions.done, (prev, payload) => ({
    ...prev,
    lastUpdateTime: payload.result.lastUpdateTime,
  }));

const availableContestsResucer = reducerWithInitialState<
  AvailableContestInfo[]
>([]).case(
  fetchAvailableContestInfoActions.done,
  (prev, payload) => payload.result
);

const officialRatingRecordsReducer = reducerWithInitialState<ContestRecord[]>(
  []
).case(
  fetchOfficialRatingRecordsActions.done,
  (prev, payload) => payload.result
);

const isUpdatingRatingReducer = reducerWithInitialState<boolean>(false)
  .case(updateContestRecordsActions.started, () => true)
  .case(updateContestRecordsActions.done, () => false)
  .case(updateContestRecordsActions.failed, () => false);

const ratingUpdateMessageReducer = reducerWithInitialState<string>('').case(
  changeRatingUpdateMessage,
  (prev, payload) => payload
);

const accountReducer = reducerWithInitialState<AccountInfo>({
  ready: false,
}).case(changeAccountInfo, (prev, payload) => payload);

const usersReducer = reducerWithInitialState<{ [id: string]: UserProfile }>({})
  .case(fetchUsersActions.done, (prev, payload) => payload.result)
  .case(updateProfileActions.done, (prev, payload) => {
    return { ...prev, [payload.params.id]: payload.result };
  })
  .case(addContestRecordAction, (prev, payload) => {
    const profile = prev[payload.id];
    if (!profile) {
      return prev;
    }
    return {
      ...prev,
      [payload.id]: {
        ...profile,
        records: addContestRecord(profile.records, payload.record),
        rating: payload.record.newRating,
      },
    };
  });

const rootReducer = combineReducers<RootState>({
  profile: profileReducer,
  availableContests: availableContestsResucer,
  officialRatingRecords: officialRatingRecordsReducer,
  isUpdatingRating: isUpdatingRatingReducer,
  ratingUpdateMessage: ratingUpdateMessageReducer,
  users: usersReducer,
  account: accountReducer,
});

export default rootReducer;
