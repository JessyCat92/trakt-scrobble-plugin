import { type BaseStorageType, createStorage, StorageEnum } from '../base/index.js';
import type { TraktDataType } from '../base/index.js';

const storage = createStorage<TraktDataType>(
  'trakt-storage-key',
  {
    accessToken: null,
    refreshToken: null,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const traktDataStorage: TraktDataStorageType = {
  ...storage,
};

export type TraktDataStorageType = BaseStorageType<TraktDataType> & {};
