import { VideoType } from '@extension/storage';
import type { IService } from '@src/parser/utils/IService';

class Wowtv implements IService {
  serviceName: string = 'WOW';
  tmdbServiceId: number = 30;
  private episodeNr: number | null = null;
  private seasonNr: number | null = null;
  private subTitle: string | null = null;
  private videoType: VideoType | null = null;

  parseMetaData() {
    const metaData = document.querySelector('.playback-metadata__container-info')?.textContent;

    if (!metaData) {
      // movies do not have that type of metadata
      this.videoType = VideoType.movie;
      return;
    }

    this.videoType = VideoType.series;

    const regex = /^S(?<season>\d*) E(?<episode>\d*): (?<subtitle>.*)$/;

    const seriesMatch = metaData.match(regex);
    if (seriesMatch) {
      this.episodeNr = parseInt(seriesMatch.groups!.episode);
      this.seasonNr = parseInt(seriesMatch.groups!.season);
      this.subTitle = seriesMatch.groups!.subtitle;
    } else {
      // some format differs? Should not happen
      console.log(metaData);
    }
  }

  getVideoType(): VideoType {
    this.parseMetaData();
    return this.videoType ?? VideoType.movie;
  }

  getCurrentEpisodeNr(): number | null {
    this.parseMetaData();
    return this.episodeNr;
  }

  getCurrentSeasonNr(): number | null {
    this.parseMetaData();
    return this.seasonNr;
  }

  getCurrentSubTitle(): string | null {
    this.parseMetaData();
    return this.subTitle;
  }

  getCurrentVideoTitle(): string {
    return document.querySelector('.playback-header__title, .playback-metadata__container-title')!.textContent!;
  }

  async getVideoUrl(): Promise<string | undefined> {
    // console.log(document.querySelector('video'));
    // return document.querySelector('video')?.src;
    return window.location.href;
  }

  isService(url: string): boolean {
    const regex = /https:\/\/www\.wowtv\.de\/(?:[^/]+\/)+[^/]+\/[^/]+/;

    return regex.test(url);
  }
}

export const WowtvInstance = new Wowtv();
export default WowtvInstance;
