import { async } from 'fast-glob';
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
  getItembyUniqueId: async (uniqueId: string) => {
    const data = await storage.get();
    return data.queueItems.find(item => item.unqiueId === uniqueId);
  },
  updateItem: async (item: ItemQueueItem) => {
    await storage.set(currentState => {
      const index = currentState.queueItems.findIndex(queueItem => queueItem.unqiueId === item.unqiueId);
      if (index !== -1) {
        currentState.queueItems[index] = item;
      }
      return currentState;
    });
  },
  resetQueue: async () => {
    await storage.set(currentState => {
      currentState.queueItems = [];
      currentState.syncedItems = [];
      return currentState;
    });
  },
  clearSyncedItems: async () => {
    await storage.set(currentState => {
      currentState.syncedItems = [];
      return currentState;
    });
  },
  isItemSyncedByUniqueId: async (uniqueId: string) => {
    const data = await storage.get();
    return !!data.syncedItems.find(item => item.unqiueId === uniqueId);
  },
  setItemSyncedByUniqueId: async (uniqueId: string) => {
    // remove from queueItems and add to syncedItems
    const data = await storage.get();
    const index = data.queueItems.findIndex(queueItem => queueItem.unqiueId === uniqueId);
    if (index !== -1) {
      data.syncedItems.push(data.queueItems[index]);
      data.queueItems.splice(index, 1);
    }
    await storage.set(currentState => {
      currentState.queueItems = data.queueItems;
      currentState.syncedItems = data.syncedItems;
      return currentState;
    });
  },
};

export interface ItemQueueItem {
  videoUrl: string;
  title: string;
  subTitle: string | null;
  season: number | null;
  episode: number | null;
  tmdbId: number | null | false; // null as long as item is not pre-processed
  serviceTmdbId: number;
  videoDuration: number;
  positions: number[]; // -> To Calculate Progress /// -1 = not calculated yet
  progress: number;
  isScrobbled: boolean;
  unqiueId: string;
  videoType: VideoType;
}

export interface ItemQueueStorage {
  queueItems: ItemQueueItem[];
  syncedItems: ItemQueueItem[];
}

export type QueueStorageType = BaseStorageType<ItemQueueStorage> & {
  addItem: (item: ItemQueueItem) => Promise<void>;
  getItembyUniqueId: (uniqueId: string) => Promise<ItemQueueItem | undefined>;
  updateItem: (item: ItemQueueItem) => Promise<void>;
  resetQueue: () => Promise<void>;
  isItemSyncedByUniqueId: (uniqueId: string) => Promise<boolean>;
  setItemSyncedByUniqueId: (uniqueId: string) => Promise<void>;
  clearSyncedItems: () => Promise<void>;
};
