import 'webextension-polyfill';
import { exampleThemeStorage, itemQueueStorage } from '@extension/storage';
import { getTmdbId } from '@src/background/tmdb';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

// @todo: can be used to background sync stuff?

// Calculate Watched Time by Interval 1 Min yet
const syncIntervalInSeconds = 1;

setInterval(async () => {
  for (const item of (await itemQueueStorage.get()).queueItems) {
    // console.log(item.positions);
    // console.log(findLatestWatchedPosition(item.positions));
    item.progress = findLatestWatchedPosition(item.positions) / item.videoDuration;
    if (!item.tmdbId) {
      item.tmdbId = await getTmdbId(item);
    }

    await itemQueueStorage.updateItem(item);
    // Field positions is storing position every some milliseconds if time is close together it is because of playing not skipping - I want to have a sum of all time between positions where it because of playing
  }
}, syncIntervalInSeconds * 1000);
// @todo: maybe split by tasks

/**
 * Findet die späteste Position einer Sequenz mit mindestens der angegebenen Anzahl aufeinanderfolgender Positionen.
 *
 * @param positions - Array von Positionswerten
 * @param minSequenceLength - Mindestanzahl an aufeinanderfolgenden Positionen für eine gültige Sequenz
 * @param proximityThreshold - Maximaler Abstand zwischen zwei aufeinanderfolgenden Positionen
 * @returns Die letzte Position der spätesten gültigen Sequenz oder 0, wenn keine gefunden wurde
 */
const findLatestWatchedPosition = (
  positions: number[],
  minSequenceLength: number = 60,
  proximityThreshold: number = 3,
): number => {
  if (positions.length < minSequenceLength) return 0; // Nicht genug Datenpunkte

  // Positionen sortieren, um chronologische Reihenfolge sicherzustellen
  const sortedPositions = [...positions].sort((a, b) => a - b);

  // Wir suchen Sequenzen von mindestens minSequenceLength aufeinanderfolgenden Positionen
  // und wollen die späteste (letzte) solche Sequenz finden
  let latestSequenceEndPosition = 0;
  let currentSequenceLength = 1;

  for (let i = 1; i < sortedPositions.length; i++) {
    const currentPosition = sortedPositions[i];
    const previousPosition = sortedPositions[i - 1];

    // Prüfen, ob die aktuelle Position nahezu aufeinanderfolgend zur vorherigen ist
    const isConsecutive = currentPosition - previousPosition <= proximityThreshold;

    if (isConsecutive) {
      currentSequenceLength++;
    } else {
      // Sequenz unterbrochen, prüfen, ob die letzte Sequenz relevant war
      if (currentSequenceLength >= minSequenceLength) {
        latestSequenceEndPosition = previousPosition;
      }

      // Neue Sequenz beginnen
      currentSequenceLength = 1;
    }
  }

  // Prüfen, ob die letzte Sequenz relevant war
  if (currentSequenceLength >= minSequenceLength) {
    latestSequenceEndPosition = sortedPositions[sortedPositions.length - 1];
  }

  return latestSequenceEndPosition;
};
