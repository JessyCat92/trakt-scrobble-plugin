import '@src/Popup.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, itemQueueStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';

// const notificationOptions = {
//   type: 'basic',
//   iconUrl: chrome.runtime.getURL('icon-34.png'),
//   title: 'Injecting content script error',
//   message: 'You cannot inject script here!',
// } as const;

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const { queueItems } = useStorage(itemQueueStorage);

  console.log('queueItems', queueItems);

  // const injectContentScript = async () => {
  //   const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
  //
  //   if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
  //     chrome.notifications.create('inject-error', notificationOptions);
  //   }
  //
  //   await chrome.scripting
  //     .executeScript({
  //       target: { tabId: tab.id! },
  //       files: ['/content-runtime/example.iife.js', '/content-runtime/all.iife.js'],
  //     })
  //     .catch(err => {
  //       // Handling errors related to other paths
  //       if (err.message.includes('Cannot access a chrome:// URL')) {
  //         chrome.notifications.create('inject-error', notificationOptions);
  //       }
  //     });
  // };

  return (
    <div className={cn('App', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <header className={cn('App-header', isLight ? 'text-gray-900' : 'text-gray-100')}>
        <div style={{ marginBottom: '1rem', border: '1px solid', padding: '1rem' }}>
          <h4>Queued Items:</h4>
          <ul style={{ listStyle: 'inside' }}>
            {/*  show list of queue items */}
            {queueItems.map(item => (
              <li key={item.videoUrl}>
                {item.title}
                {item.subTitle ? <> - {item.subTitle} </> : <></>} -{' '}
                {item.progress > 0 ? Math.round(item.progress * 100) : 0} %
              </li>
            ))}
          </ul>
          {window.location.href}
        </div>
        {/*<button*/}
        {/*  className={cn(*/}
        {/*    'mt-4 rounded px-4 py-1 font-bold shadow hover:scale-105',*/}
        {/*    isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white',*/}
        {/*  )}*/}
        {/*  onClick={injectContentScript}>*/}
        {/*  {t('injectButton')}*/}
        {/*</button>*/}
        <ToggleButton>{t('toggleTheme')}</ToggleButton>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
