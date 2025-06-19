import { itemQueueStorage, VideoType } from '@extension/storage';
import { Wowtv } from '@src/parser/services/wowtv';
import type { IService } from '@src/parser/utils/IService';

type Implements<T, U extends T> = U;
const services: Implements<IService, any>[] = [Wowtv];

/**
 * Get the service for the current page
 * If Service is not found, return null
 */
export const getService = async () => {
  for (const serviceClass of services) {
    const service = new serviceClass();
    // console.log('href', window.location.href);
    if (service.isService(window.location.href)) {
      return service;
    }
  }
  return null;
};

export const processPage = async () => {
  const service = await getService();
  if (!service) return;

  // Select the node that will be observed for mutations
  // const targetNode = document.getElementById('mainContainer');
  const targetNode = document.body; // do we need this from per service to avoid advertising video shit?

  const video = targetNode.querySelector('video');

  if (video) {
    video.addEventListener('timeupdate', () => processVideoProgress(video));
  } else {
    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    const callback = (mutationList: MutationRecord[]) => {
      let videoComponent: Node | undefined;

      // page reloads and video get added via
      for (const mutation of mutationList) {
        videoComponent = Array.from(mutation.addedNodes).find((node: Node) => node.nodeName.toLowerCase() === 'video');
      }

      if (!videoComponent) return;

      // video Component is loaded -> we can now start the scrobbling
      // console.log(videoComponent);
      const video = videoComponent as HTMLMediaElement;
      console.log(video);
      video.addEventListener('timeupdate', () => processVideoProgress(video));
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  }
};

const processVideoProgress = async (video: HTMLMediaElement) => {
  const service = await getService();
  // video time should be longer then 3 seconds - otherwise it is still loading
  if (video.currentTime <= 15) return;

  await processItem({
    videoUrl: (await service.getVideoUrl())!,
    videoDuration: video.duration,
    videoCurrentTime: video.currentTime,
    videoType: service.getVideoType(),
    title: service.getCurrentVideoTitle(),
    subtitle: service.getCurrentSubTitle(),
    season: service.getCurrentSeasonNr(),
    episode: service.getCurrentEpisodeNr(),
    uniqueId: await service.getUniqueIdentifier(),
    service,
  });
};

export interface RawItemData {
  videoUrl: string;
  videoDuration: number;
  videoCurrentTime: number;
  videoType: VideoType;
  title: string | null;
  subtitle: string | null;
  season: number | null;
  episode: number | null;
  uniqueId: string;
  service: IService;
}

export const processItem = async (rawItem: RawItemData) => {
  // @todo: get if not exist tmdbId and counter check server tmdb Id  -> maybe in backgrond process together with calculating Watch Time
  console.log('cpatured New Item:', rawItem);

  const item = await itemQueueStorage.getItembyUniqueId(rawItem.uniqueId);
  const isSynced = await itemQueueStorage.isItemSyncedByUniqueId(rawItem.uniqueId);
  if (isSynced) {
    console.debug('Item is already synced, skipping it.');
    return;
  }

  if (!item) {
    // console.log('storage:', await itemQueueStorage.get());
    // console.log('add new Item', rawItem);
    await itemQueueStorage.addItem({
      videoUrl: rawItem.videoUrl,
      unqiueId: rawItem.uniqueId,
      title: rawItem.title!,
      subTitle: rawItem.subtitle,
      season: rawItem.season,
      episode: rawItem.episode,
      tmdbId: null,
      serviceTmdbId: rawItem.service.tmdbServiceId,
      videoDuration: rawItem.videoDuration,
      positions: [rawItem.videoCurrentTime],
      progress: -1, /// -1: not calculated yet
      isScrobbled: false,
      videoType: rawItem.videoType,
    });
  } else {
    if (!item.subTitle) item.subTitle = rawItem.subtitle;
    if (!item.title || item.title.length < 1) item.title = rawItem.title!;
    if (!item.season) item.season = rawItem.season;
    if (!item.episode) item.episode = rawItem.episode;
    if (!item.subTitle && !item.season && !item.episode && !rawItem.episode && !rawItem.season && !rawItem.subtitle) {
      item.videoType = VideoType.movie;
    } else {
      item.videoType = VideoType.series;
    }

    item.positions.push(rawItem.videoCurrentTime);

    console.log('updateItem');
    await itemQueueStorage.updateItem(item);
  }
};

// export interface ItemQueueItem {
//   videoUrl: string;
//   title: string;
//   subTitle: string | null;
//   season: number | null;
//   episode: number | null;
//   tmdbId: number;
//   serviceTmdbId: number;
//   videoDuration: number;
//   positions: number[]; // -> To Calculate Progress
//   progress: number;
//   isScrobbled: boolean;
//   watchedTime: number;
// }
