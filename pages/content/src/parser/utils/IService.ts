import type { VideoType } from '@extension/storage';

export interface IService {
  serviceName: string;
  tmdbServiceId: number;
  /**
   * is Url part of this service?
   */
  isService(url: string): boolean;

  /**
   * get Video Type
   */
  getVideoType(): VideoType;

  /**
   * Video Title
   */
  getCurrentVideoTitle(): string | null;

  /**
   * Video Subtitle (Title of Episode)
   */
  getCurrentSubTitle(): string | null;

  /**
   * if possible Season Nr.
   */
  getCurrentSeasonNr(): number | null;

  /**
   * if possible Episode Nr.
   */
  getCurrentEpisodeNr(): number | null;

  /**
   * getVideoUrl
   */
  getVideoUrl(): Promise<string | undefined>;
}
