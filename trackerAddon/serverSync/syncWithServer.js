import * as FileSystem from 'expo-file-system';
import { clearLogs, getLogFilePath, getScreenshotFilePath } from '../utils/storageManagement';

const SERVER_URL = 'http://192.168.3.91:3000/log'; 

export async function syncWithServer() {
  try {
    const [logContent, screenshotContent, screenTimeContent] = await Promise.all([
      FileSystem.readAsStringAsync(getLogFilePath()),
      FileSystem.readAsStringAsync(getScreenshotFilePath()),
    ]);

    const payload = {
      logs: JSON.parse(logContent || '[]'),
      screenshots: JSON.parse(screenshotContent || '[]'),
      screenTime: JSON.parse(screenTimeContent || '[]'),
    };

    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log('[Sync] Logs successfully sent to server.');
      await clearLogs();
    } else {
      console.warn('[Sync] Server responded but with error:', response.status);
    }
  } catch (err) {
    console.error('[Sync] Failed to sync with server:', err.message);
  }
}
