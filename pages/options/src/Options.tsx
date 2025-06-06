import '@src/Options.css';
import { t } from '@extension/i18n';
import {
  TraktApi,
  TraktGetDeviceCodeResponse,
  useStorage,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared/index.mjs';
import { exampleThemeStorage, itemQueueStorage, traktDataStorage } from '@extension/storage';
import { Button, cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';
import { useEffect, useState } from 'react';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Access Token Expired or Missing',
  message: 'Access Token has Expired or is Missing, Please reauthenticate',
} as const;

async function loadAccessToken(setIsCodeExpired: Function) {
  const traktApi = new TraktApi(process.env['CEB_TRAKT_CLIENT_ID']!, process.env['CEB_TRAKT_CLIENT_SECRET']!);
  // @todo: check if access token is expired or refresh token is expired
  const deviceCodes = await traktApi.getDeviceCode();

  let interval = setInterval(async () => {
    if ((await traktApi.checkForAccess()) === false) {
      clearInterval(interval);
      setIsCodeExpired(true);
    }
  }, 1000);

  return deviceCodes as TraktGetDeviceCodeResponse;
}

async function manualSync(id: string) {
  const traktApi = new TraktApi(process.env['CEB_TRAKT_CLIENT_ID']!, process.env['CEB_TRAKT_CLIENT_SECRET']!);
  if (await traktApi.isAuthenticated()) {
    const item = await itemQueueStorage.getItembyUniqueId(id);
    item!.tmdbId! = -item!.tmdbId!;
    await traktApi.syncItemToHistory(item!);
  } else {
    chrome.notifications.create('access-token-missing', notificationOptions).then(console.log).catch(console.error);
  }
}

const Options = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { queueItems, syncedItems } = useStorage(itemQueueStorage);
  const { accessToken, refreshToken, expires_at } = useStorage(traktDataStorage);
  const [codeData, setCodeData] = useState<TraktGetDeviceCodeResponse | null>(null);
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  const expireDate = expires_at ? new Date(expires_at) : '';

  console.log('frontend', process.env['CEB_TRAKT_CLIENT_ID']!, process.env['CEB_TRAKT_CLIENT_SECRET']!);
  useEffect(() => {
    if (accessToken) return;
    // needs test if it works?
    setIsCodeExpired(false);
    loadAccessToken(setIsCodeExpired).then(data => setCodeData(data));
  }, [isCodeExpired]);

  return (
    <div className={cn('App', isLight ? 'bg-slate-50 text-gray-900' : 'bg-gray-800 text-gray-100')}>
      {/*@todo if not access token or refresh token, show login button*/}

      {!accessToken || !refreshToken ? (
        <div style={{ marginBottom: '1rem' }}>
          {codeData ? (
            <>
              Please visit{' '}
              <a
                style={{
                  color: 'lightblue',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
                href={codeData.verification_url + '/' + codeData.user_code}
                target="_blank"
                rel="noreferrer">
                {codeData.verification_url}
              </a>{' '}
              and verify the following code: <b>{codeData.user_code}</b>
            </>
          ) : (
            <LoadingSpinner />
          )}
        </div>
      ) : (
        <></>
      )}

      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Trakt Data:</h4>
        <ul style={{ listStyle: 'inside' }}>
          <li>Access Token: {accessToken}</li>
          <li>Refresh Token: {refreshToken}</li>
          <li>Access Token Expires At: {expireDate.toString()}</li>
          <li>
            <Button onClick={traktDataStorage.resetTokens}>Reset Tokens</Button>
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Queued Items:</h4>
        <ul style={{ listStyle: 'inside' }}>
          {queueItems.map(item => (
            <>
              {!item.tmdbId || item.tmdbId > -2 ? (
                <li key={item.videoUrl}>
                  <a href={item.videoUrl} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                  {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
                  {item.progress > 0 ? Math.round(item.progress * 100) : 0} % (TMDB: {item.tmdbId} - UUID:{' '}
                  {item.unqiueId})
                </li>
              ) : (
                <></>
              )}
            </>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Manual Sync required:</h4>
        <ul style={{ listStyle: 'inside' }}>
          {queueItems.map(item => (
            <>
              {item.tmdbId && item.tmdbId < -1 ? (
                <li key={item.videoUrl}>
                  <a href={item.videoUrl} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                  {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
                  {item.progress > 0 ? Math.round(item.progress * 100) : 0} % (TMDB: {item.tmdbId} - UUID:{' '}
                  {item.unqiueId}){' '}
                  <Button style={{ fontSize: '0.5em' }} onClick={() => manualSync(item.unqiueId)}>
                    Sync
                  </Button>
                </li>
              ) : (
                <></>
              )}
            </>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Synced Items:</h4>
        <ul style={{ listStyle: 'inside' }}>
          {syncedItems.map(item => (
            <li key={item.videoUrl}>
              {item.unqiueId}-{' '}
              <a href={item.videoUrl} target="_blank" rel="noreferrer">
                {item.title}
              </a>
              {item.subTitle ? <> - {item.subTitle} </> : <></>}
            </li>
          ))}
        </ul>
      </div>
      <hr />
      <div style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ToggleButton style={{ marginLeft: '5px', marginRight: '5px' }} onClick={exampleThemeStorage.toggle}>
          {t('toggleTheme')}
        </ToggleButton>
        <Button style={{ marginLeft: '5px', marginRight: '5px' }} onClick={itemQueueStorage.resetQueue}>
          Reset Complete Queue
        </Button>
        <Button style={{ marginLeft: '5px', marginRight: '5px' }} onClick={itemQueueStorage.clearSyncedItems}>
          Clear Synced Items
        </Button>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
