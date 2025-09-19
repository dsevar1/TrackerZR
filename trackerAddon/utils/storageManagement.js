import * as FileSystem from 'expo-file-system';

const LOG_FILE_PATH = FileSystem.documentDirectory + 'tracker/cache/button_logs.json';
const SCREENSHOT_FILE_PATH = FileSystem.documentDirectory + 'tracker/cache/screenshots.json';

export function getLogFilePath() {
  return LOG_FILE_PATH;
}

export function getScreenshotFilePath() {
  return SCREENSHOT_FILE_PATH;
}

export async function saveButtonPress({ name, timestamp, sessionId }) {
  try {
    const dir = LOG_FILE_PATH.substring(0, LOG_FILE_PATH.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    let logs = [];
    const fileInfo = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
      logs = JSON.parse(content || '[]');
    }

    logs.push({ name, timestamp, sessionId });

    await FileSystem.writeAsStringAsync(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
    console.log('[Tracker] Log saved.');
  } catch (err) {
    console.error('[Tracker] Failed to save button press log:', err);
  }
}

export async function saveScreenshotBase64({ name, timestamp, sessionId, screenshot }) {
  try {
    const dir = SCREENSHOT_FILE_PATH.substring(0, SCREENSHOT_FILE_PATH.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    let screenshots = [];
    const fileInfo = await FileSystem.getInfoAsync(SCREENSHOT_FILE_PATH);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(SCREENSHOT_FILE_PATH);
      screenshots = JSON.parse(content || '[]');
    }

    screenshots.push({ name, timestamp, sessionId, screenshot });

    await FileSystem.writeAsStringAsync(SCREENSHOT_FILE_PATH, JSON.stringify(screenshots, null, 2));
    console.log('[Tracker] Screenshot log saved.');
  } catch (err) {
    console.error('[Tracker] Failed to save screenshot log:', err);
  }
}

export async function clearLogs() {
  try {
    await FileSystem.writeAsStringAsync(LOG_FILE_PATH, '[]');
    await FileSystem.writeAsStringAsync(SCREENSHOT_FILE_PATH, '[]');
    console.log('[Tracker] Logs and screenshots cleared.');
  } catch (err) {
    console.error('[Tracker] Failed to clear logs:', err);
  }
}

export async function readLogs() {
  try {
    const logs = await readJsonFile(LOG_FILE_PATH, '[Tracker] Button log file');
    const screenshots = await readJsonFile(SCREENSHOT_FILE_PATH, '[Tracker] Screenshot file');

    if (logs.length > 0) {
      console.log(`\n[Tracker] Read ${logs.length} button log entries:`);
      logs.forEach((log, index) => {
        const date = new Date(log.timestamp).toLocaleString();
        console.log(`  ${index + 1}. ${log.name} @ ${date} (session: ${log.sessionId})`);
      });
    }

    if (screenshots.length > 0) {
      console.log(`\n[Tracker] Read ${screenshots.length} screenshots:`);
      screenshots.forEach((shot, index) => {
        const date = new Date(shot.timestamp).toLocaleString();
        console.log(`  ${index + 1}. ${shot.name} @ ${date} (session: ${shot.sessionId}) [base64 length: ${shot.screenshot.length}]`);
      });
    }

    return { logs, screenshots };
  } catch (err) {
    console.error('[Tracker] Failed to read logs or screenshots:', err);
    return { logs: [], screenshots: [] };
  }
}

async function readJsonFile(path, label) {
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (!fileInfo.exists) {
    console.log(`${label} not found.`);
    return [];
  }

  const content = await FileSystem.readAsStringAsync(path);
  const parsed = JSON.parse(content || '[]');

  if (parsed.length === 0) {
    console.log(`${label} is empty.`);
  }

  return parsed;
}
