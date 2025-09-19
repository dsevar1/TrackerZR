import * as FileSystem from 'expo-file-system';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const SESSION_FILE_PATH = FileSystem.documentDirectory + 'tracker/cache/session.json';

let sessionId = null;

export { sessionId };

(async () => {
  try {
    const dir = SESSION_FILE_PATH.substring(0, SESSION_FILE_PATH.lastIndexOf('/'));
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    const fileInfo = await FileSystem.getInfoAsync(SESSION_FILE_PATH);

    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(SESSION_FILE_PATH);
      const parsed = JSON.parse(content || '{}');
      if (parsed.sessionId) {
        sessionId = parsed.sessionId;
        console.log('[Tracker] Loaded session ID:', sessionId);
        return;
      }
    }

    sessionId = uuidv4();
    await FileSystem.writeAsStringAsync(SESSION_FILE_PATH, JSON.stringify({ sessionId }), {
      encoding: FileSystem.EncodingType.UTF8,
    });
    console.log('[Tracker] Generated and saved new session ID:', sessionId);
  } catch (error) {
    console.error('[Tracker] Failed to load or generate session ID:', error);
    sessionId = uuidv4(); 
  }
})();
