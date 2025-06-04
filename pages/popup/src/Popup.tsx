import '@src/Popup.css';
import { TraktApi, TraktGetDeviceCodeResponse, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, itemQueueStorage, traktDataStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
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

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { queueItems } = useStorage(itemQueueStorage);
  const { accessToken, refreshToken, expires_at } = useStorage(traktDataStorage);
  const [codeData, setCodeData] = useState<TraktGetDeviceCodeResponse | null>(null);
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  console.log('frontend', process.env['CEB_TRAKT_CLIENT_ID']!, process.env['CEB_TRAKT_CLIENT_SECRET']!);
  useEffect(() => {
    if (accessToken) {
      if (expires_at! - 60000 > Date.now()) {
        // check if it is expired
        return;
      }
    }

    // chrome.notifications.create('access-token-missing', notificationOptions).then(console.log).catch(console.error);
    // needs test if it works?
    setIsCodeExpired(false);
    loadAccessToken(setIsCodeExpired).then(data => setCodeData(data));
  }, [isCodeExpired]);

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
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
          <h4>Queued Items:</h4>
          <ul style={{ listStyle: 'inside' }}>
            {queueItems.map(item => (
              <li key={item.videoUrl}>
                <a href={item.videoUrl} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
                {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
                {item.progress > 0 ? Math.round(item.progress * 100) : 0} % (TMDB: {item.tmdbId} - UUID: {item.unqiueId}
                )
              </li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
