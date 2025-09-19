import {SyncProvider} from './serverSync/syncProvider'
import { ScreenshotProvider } from './utils/screenshots.js';
export { useTrackButtonPress } from './utils/buttonTracker.js';

export {
  clearLogs, getLogFilePath,
  getScreenshotFilePath, readLogs, saveButtonPress,
  saveScreenshotBase64
} from './utils/storageManagement.js';

export function TrackingAddon({ children }) {
  return (
    <SyncProvider>
      <ScreenshotProvider>
        {children}
      </ScreenshotProvider>
    </SyncProvider>
  );
}