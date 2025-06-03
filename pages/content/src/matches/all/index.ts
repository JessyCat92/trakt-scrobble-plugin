import { processPage } from '@src/parser/process';

console.log('[CEB] All content script loaded');

processPage().then(console.log).catch(console.error);
