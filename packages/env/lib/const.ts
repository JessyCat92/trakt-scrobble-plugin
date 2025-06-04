export const IS_DEV = process.env['CLI_CEB_DEV'] === 'true';
export const IS_PROD = !IS_DEV;
export const IS_FIREFOX = process.env['CLI_CEB_FIREFOX'] === 'true';
export const IS_CI = process.env['CEB_CI'] === 'true';
export const TRAKT_CLIENT_ID = process.env['CEB_TRAKT_CLIENT_ID'];
export const TRAKT_CLIENT_SECRET = process.env['CEB_TRAKT_CLIENT_SECRET'];
export const TMDB_API_KEY = process.env['CEB_TMDB_API_KEY'];
