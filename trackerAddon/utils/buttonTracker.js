import { useCallback } from 'react';
import { useScreenshot } from './screenshots.js';
import { sessionId } from './session.js';
import { saveButtonPress } from './storageManagement.js';

export function useTrackButtonPress() {
  const { captureAndReset } = useScreenshot();

  return useCallback(async (name) => {
    const timestamp = Date.now();

    try {
      await captureAndReset(name); 
    } catch (err) {
      console.error('[Tracker] Failed to capture screenshot on button press:', err);
    }

    await saveButtonPress({ name, timestamp, sessionId });
    console.log(`[Tracker] Button pressed: ${name} @ ${timestamp} (session ${sessionId})`);
  }, [captureAndReset]);
}
