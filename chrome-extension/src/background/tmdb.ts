import { TMDB_API_KEY } from '@extension/env';
import { VideoType } from '@extension/storage';
import { EpisodeTranslationsResponse, MovieDb } from 'moviedb-promise';
import type { ItemQueueItem } from '@extension/storage';

const getSeriesEpisodeId = async (item: ItemQueueItem): Promise<number | null> => {
  // console.log(TMDB_API_KEY);
  const tmdb = new MovieDb(TMDB_API_KEY!);

  if (item.subTitle && (item.episode === null || item.season === null)) {
    // @todo: resolve season and episode by subTitle - is not implemented yet
    return null;
  }

  const seriesData = await tmdb.searchTv({ query: item.title });
  let seriesId = -1;

  for (const series of seriesData.results!) {
    // check if first item is exact match
    // @todo: do we need to check translations? e.g. different if title is german - is result then also german?
    if (series.name === item.title) {
      // counter-check for item that is an exact match
      seriesId = series.id!;
      break;
    }
  }

  if (seriesId === -1) {
    // series could not be found
    return null;
  }

  const episodeData = await tmdb.episodeInfo({
    id: seriesId,
    season_number: item.season!,
    episode_number: item.episode!,
    append_to_response: 'translations',
  });

  // @ts-ignore
  const translations = episodeData.translations as EpisodeTranslationsResponse;
  if (
    !translations.translations?.some(tItem => {
      return tItem.data?.name === item.subTitle;
    })
  ) {
    console.error('Translation not found - incorrect series or episode');
    return null;
  }

  return episodeData.id!;
};

export const getTmdbId = async (item: ItemQueueItem): Promise<number | null> => {
  const tmdb = new MovieDb(TMDB_API_KEY!);
  if (!item.videoType) {
    if (item.season === null && item.episode === null && item.subTitle === null) {
      item.videoType = VideoType.movie;
    } else {
      item.videoType = VideoType.series;
    }
  }

  if (item.videoType === VideoType.movie) {
    console.log(await tmdb.searchMovie({ query: item.title }));
  } else if (item.videoType === VideoType.series) {
    return await getSeriesEpisodeId(item);
  }

  return null;
};
