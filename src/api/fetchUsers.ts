import UserProfile from '../types/userProfile';
import {
  getActiveHandle,
  getSavedHandles,
  getSavedProfile,
} from './userProfile';

export const fetchUsersAPI = async () => {
  try {
    const users: { [id: string]: UserProfile } = {};
    const handles = getSavedHandles();
    const activeHandle = getActiveHandle();
    const allHandles = [
      ...handles,
      ...(activeHandle ? [activeHandle] : []),
    ].filter((handle, index, array) => {
      return (
        array.findIndex(
          (item) => item.toLowerCase() === handle.toLowerCase()
        ) === index
      );
    });

    for (const handle of allHandles) {
      const profile = getSavedProfile(handle);
      if (profile) {
        users[profile.handle] = profile;
      }
    }
    return users;
  } catch (e) {
    throw e;
  }
};
