import '@src/Options.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, itemQueueStorage } from '@extension/storage';
import { Button, cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';

const Options = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { queueItems, syncedItems } = useStorage(itemQueueStorage);

  return (
    <div className={cn('App', isLight ? 'bg-slate-50 text-gray-900' : 'bg-gray-800 text-gray-100')}>
      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Queued Items:</h4>
        <ul style={{ listStyle: 'inside' }}>
          {/*  show list of queue items */}
          {queueItems.map(item => (
            <li key={item.videoUrl}>
              {item.videoUrl} - {item.title}
              {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
              {item.progress > 0 ? Math.round(item.progress * 100) : 0} % (TMDB: {item.tmdbId})
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
        <h4>Synced Items:</h4>
        <ul style={{ listStyle: 'inside' }}>
          {/*  show list of queue items */}
          {syncedItems.map(item => (
            <li key={item.videoUrl}>
              {item.videoUrl} - {item.title}
              {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
              {item.progress > 0 ? Math.round(item.progress * 100) : 0} %
            </li>
          ))}
        </ul>
      </div>
      <hr />
      <ToggleButton onClick={exampleThemeStorage.toggle}>{t('toggleTheme')}</ToggleButton>
      <Button onClick={itemQueueStorage.resetQueue}>{t('resetQueue')}</Button>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
