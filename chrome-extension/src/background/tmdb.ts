import { TMDB_API_KEY } from '@extension/env';
import { VideoType } from '@extension/storage';
import { EpisodeTranslationsResponse, MovieDb } from 'moviedb-promise';
import type { ItemQueueItem } from '@extension/storage';

const getSeriesEpisodeId = async (item: ItemQueueItem): Promise<number | null | false> => {
  console.log(TMDB_API_KEY);
  const tmdb = new MovieDb(TMDB_API_KEY!);

  if (item.subTitle && (item.episode === null || item.season === null)) {
    // @todo: resolve season and episode by subTitle - is not implemented yet
    return null;
  }

  const seriesData = await tmdb.searchTv({ query: item.title });
  let seriesId = -1;

  for (const series of seriesData.results!) {
    // check if first item is exact match
    if (series.name === item.title) {
      // counter-check for item that is an exact match
      seriesId = series.id!;
      break;
    }

    const translations = await tmdb.tvTranslations({
      id: series.id!,
    });

    if (translations.translations?.some(tItem => tItem.data?.name === item.title)) {
      seriesId = series.id!;
      break;
    }
  }

  if (seriesId === -1) {
    // series could not be found
    return false;
  }

  const episodeData = await tmdb.episodeInfo({
    id: seriesId,
    season_number: item.season!,
    episode_number: item.episode!,
    append_to_response: 'translations',
  });

  if (!episodeData || !episodeData.id) {
    return false;
  }

  // @ts-ignore
  const translations = episodeData.translations as EpisodeTranslationsResponse;
  if (
    !translations.translations?.some(tItem => {
      return tItem.data?.name === item.subTitle;
    })
  ) {
    console.error('Translation not found - incorrect series or episode - manual approval required');
    return -episodeData.id;
  }

  return episodeData.id;
};

export const getTmdbId = async (item: ItemQueueItem): Promise<number | false | null> => {
  const tmdb = new MovieDb(TMDB_API_KEY!);
  if (!item.videoType) {
    if (item.season === null && item.episode === null && item.subTitle === null) {
      item.videoType = VideoType.movie;
    } else {
      item.videoType = VideoType.series;
    }
  }

  if (item.videoType === VideoType.movie) {
    return await getMovieItemId(item);
  } else if (item.videoType === VideoType.series) {
    return await getSeriesEpisodeId(item);
  }

  return null;
};

const getMovieItemId = async (item: ItemQueueItem): Promise<number | false | null> => {
  const tmdb = new MovieDb(TMDB_API_KEY!);
  const movieData = await tmdb.searchMovie({ query: item.title });

  let movieId = -1;

  for (const movie of movieData.results!) {
    if (movie.title === item.title) {
      // counter-check for item that is an exact match
      movieId = movie.id!;
      break;
    }

    const translations = await tmdb.movieTranslations({
      id: movie.id!,
    });

    if (translations.translations?.some(tItem => (tItem.data! as { title: string }).title === item.title)) {
      movieId = movie.id!;
      break;
    }
  }

  return movieId;
};
