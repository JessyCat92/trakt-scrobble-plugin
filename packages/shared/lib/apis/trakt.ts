// import { TRAKT_CLIENT_ID, TRAKT_CLIENT_SECRET } from '@extension/env/index.mjs';
import { ItemQueueItem, itemQueueStorage, traktDataStorage } from '@extension/storage';
import axios, { Axios } from 'axios';

// import env here breaks whyever build process
// const TRAKT_CLIENT_ID = 'c982de227fe78d38d179fd69ec1b2a1b22b95962cebd4c250a61e7ae0b0fdac6';
// const TRAKT_CLIENT_SECRET = '896cb6d9d17243803a5217285adeca45bb5ef5aad2e30d8b59a2d4cffc554f6a';

export class TraktApi {
  private axiosInstance: Axios = axios;
  private lastAuthRequestData: TraktGetDeviceCodeResponse | null = null;
  private lastAuthRequestTime: number = Date.now();
  public ready: Promise<void>;
  private traktClientId: string;
  private traktClientSecret: string;

  constructor(traktClientId: string, traktClientSecret: string) {
    this.traktClientId = traktClientId;
    this.traktClientSecret = traktClientSecret;

    console.log(traktClientId, traktClientSecret);

    this.axiosInstance = axios.create({
      baseURL: 'https://api.trakt.tv',
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-key': this.traktClientId,
        'trakt-api-version': '2',
        // 'User-Agent': 'mySync/1.0',
      },
    });

    this.ready = this.setAccessTokenOrRefresh();
    // this.ready = Promise.resolve();
  }

  private async setAccessTokenOrRefresh() {
    console.log('setAccessTokenOrRefresh');
    const tokenData = await traktDataStorage.get();
    const token = tokenData.accessToken;
    // console.log(tokenData.expires_at);
    if (token) {
      this.setAccessToken(token);
    }
    // else if (tokenData.refreshToken) {
    //   if (tokenData.expires_at! - 60000 > Date.now()) {
    //     // for now remove tokens to show problems on UI
    //     await traktDataStorage.resetTokens();
    //     // const data = await this.axiosInstance.post('/oauth/token', {
    //     //   client_id: TRAKT_CLIENT_ID,
    //     //   client_secret: TRAKT_CLIENT_SECRET,
    //     //   refresh_token: tokenData.refreshToken,
    //     //   redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
    //     //   scope: 'public',
    //     //   grant_type: 'authorization_code',
    //     // });
    //     // console.log(data);
    //     // refreshToken is not working for device code why ever - maybe replace with real oauth
    //   }
    //   // @todo: refresh token by using refresh token
    // }
  }

  public async isAuthenticated() {
    const tokenData = await traktDataStorage.get();
    const token = tokenData.accessToken;
    return token && tokenData.expires_at! - 60000 > Date.now();
  }

  public async syncItemToHistory(item: ItemQueueItem) {
    let result;
    if (item.videoType === 'movie') {
      result = await this.axiosInstance.post('/sync/history', {
        movies: [
          {
            ids: {
              tmdb: item.tmdbId,
            },
          },
        ],
      });
    } else {
      result = await this.axiosInstance.post('/sync/history', {
        episodes: [
          {
            ids: {
              tmdb: item.tmdbId,
            },
          },
        ],
      });
    }

    if (result.data.added.movies > 0 || result.data.added.episodes > 0) {
      item.isScrobbled = true;
      await itemQueueStorage.updateItem(item);
      await itemQueueStorage.setItemSyncedByUniqueId(item.unqiueId);
    } else {
      console.log('item not added to history', result.data);
    }
  }

  public setAccessToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  public async getDeviceCode() {
    const data = await this.axiosInstance.post('/oauth/device/code', {
      client_id: this.traktClientId,
    });
    this.lastAuthRequestData = data.data as TraktGetDeviceCodeResponse;
    this.lastAuthRequestTime = Date.now();

    return data.data as TraktGetDeviceCodeResponse;
  }

  public async checkForAccess() {
    if (!this.lastAuthRequestData) {
      return false;
    }

    if (this.lastAuthRequestData.expires_in + this.lastAuthRequestTime * 1000 < Date.now()) {
      // is expired
      return false;
    }

    const response = await this.axiosInstance.post<TraktAccessTokenResponse>('/oauth/device/token', {
      client_id: this.traktClientId,
      client_secret: this.traktClientSecret,
      code: this.lastAuthRequestData?.device_code,
    });

    if (response.data) {
      this.setAccessToken(response.data.access_token);
      const until = (response.data.expires_in + response.data.created_at) * 1000;
      await traktDataStorage.updateTokens(response.data.access_token, response.data.refresh_token, until);
      return response.data;
    }

    return null;
  }
}

export interface TraktGetDeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export interface TraktAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}
