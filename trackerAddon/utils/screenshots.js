import React, { createContext, useCallback, useEffect, useRef } from 'react';
import { captureScreen } from 'react-native-view-shot';
import { sessionId } from './session';
import { saveScreenshotBase64 } from './storageManagement';

const ScreenshotContext = createContext();

export function ScreenshotProvider({ children }) {
  const intervalRef = useRef(null);

  const captureScreenshot = useCallback(
    async (customName = 'auto-screenshot') => {
      try {
        const uri = await captureScreen({
          format: 'jpg',
          quality: 0.3,
          result: 'base64',
        });

        const base64Data = `data:image/jpeg;base64,${uri}`;
        const timestamp = Date.now();

        await saveScreenshotBase64({
          name: customName,
          timestamp,
          sessionId,
          screenshot: base64Data,
        });

        console.log(`[Tracker] Screenshot saved: ${customName} @ ${new Date(timestamp).toLocaleTimeString()}`);
      } catch (err) {
        console.error('[Tracker] Failed to capture screenshot:', err);
      }
    },
    []
  );

  const resetInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => captureScreenshot(), 10000);
    console.log('[Tracker] Screenshot interval reset.');
  }, [captureScreenshot]);

  const captureAndReset = useCallback(
    async (buttonName = null) => {
      const name = buttonName ? `${buttonName}-screenshot` : 'auto-screenshot';
      await captureScreenshot(name);
      resetInterval();
    },
    [captureScreenshot, resetInterval]
  );

  useEffect(() => {
    resetInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetInterval]);

  return (
    <ScreenshotContext.Provider value={{ captureAndReset }}>
      {children}
    </ScreenshotContext.Provider>
  );
}

export function useScreenshot() {
  const context = React.useContext(ScreenshotContext);
  if (!context) {
    throw new Error('useScreenshot must be used within ScreenshotProvider');
  }
  return context;
}
