import { type BaseStorageType, createStorage, StorageEnum } from '../base/index.js';
import type { TraktDataType } from '../base/index.js';

const storage = createStorage<TraktDataType>(
  'trakt-storage-key',
  {
    accessToken: null,
    refreshToken: null,
    expires_at: null,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const traktDataStorage: TraktDataStorageType = {
  ...storage,
  updateTokens: async (accessToken: string, refreshToken: string, accessTokenExpiresAt: number) => {
    await storage.set(currentState => {
      return {
        accessToken,
        refreshToken,
        expires_at: accessTokenExpiresAt,
      };
    });
  },
  resetTokens: async () => {
    await storage.set(currentState => {
      return {
        accessToken: null,
        refreshToken: null,
        expires_at: null,
      };
    });
  },
};

export type TraktDataStorageType = BaseStorageType<TraktDataType> & {
  updateTokens: (accessToken: string, refreshToken: string, accessTokenExpiresAt: number) => Promise<void>;
  resetTokens: () => Promise<void>;
};
