import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType, VideoType } from '../base/index.js';

const storage = createStorage<ItemQueueStorage>(
  'item-queue-storage-key',
  {
    queueItems: [],
    syncedItems: [],
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const itemQueueStorage: QueueStorageType = {
  ...storage,
  addItem: async (item: ItemQueueItem) => {
    await storage.set(currentState => {
      currentState.queueItems.push(item);
      return currentState;
    });
  },
  getItembyUrl: async (url: string) => {
    const data = await storage.get();
    return data.queueItems.find(item => item.videoUrl === url);
  },
  updateItem: async (item: ItemQueueItem) => {
    await storage.set(currentState => {
      const index = currentState.queueItems.findIndex(queueItem => queueItem.videoUrl === item.videoUrl);
      if (index !== -1) {
        currentState.queueItems[index] = item;
      }
      return currentState;
    });
  },
  resetQueue: async () => {
    await storage.set(currentState => {
      currentState.queueItems = [];
      return currentState;
    });
  },
  isItemSyncedByUrl: async (url: string) => {
    const data = await storage.get();
    return !!data.syncedItems.find(item => item.videoUrl === url);
  },
};

export interface ItemQueueItem {
  videoUrl: string;
  title: string;
  subTitle: string | null;
  season: number | null;
  episode: number | null;
  tmdbId: number | null; // null as long as item is not pre-processed
  serviceTmdbId: number;
  videoDuration: number;
  positions: number[]; // -> To Calculate Progress /// -1 = not calculated yet
  progress: number;
  isScrobbled: boolean;
  videoType: VideoType;
}

export interface ItemQueueStorage {
  queueItems: ItemQueueItem[];
  syncedItems: ItemQueueItem[];
}

export type QueueStorageType = BaseStorageType<ItemQueueStorage> & {
  addItem: (item: ItemQueueItem) => Promise<void>;
  getItembyUrl: (url: string) => Promise<ItemQueueItem | undefined>;
  updateItem: (item: ItemQueueItem) => Promise<void>;
  resetQueue: () => Promise<void>;
  isItemSyncedByUrl: (url: string) => Promise<boolean>;
};
