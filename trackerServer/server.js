const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) {
  return path.join(DATA_DIR, name);
}

function safeReadArray(name) {
  try {
    const p = filePath(name);
    if (!fs.existsSync(p)) return [];
    const txt = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(txt || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeArray(name, arr) {
  fs.writeFileSync(filePath(name), JSON.stringify(arr, null, 2), 'utf-8');
}

app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));

app.use('/files', express.static(DATA_DIR));

app.get('/data/screenshots.json', (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-store');
    const p = path.join(DATA_DIR, 'screenshots.json');
    if (!fs.existsSync(p)) {
      return res.status(404).json({ ok: false, message: 'screenshots.json not found' });
    }
    res.sendFile(p);
  } catch (err) {
    console.error('❌ Error serving screenshots.json:', err);
    res.status(500).json({ ok: false, message: 'Failed to read screenshots.json' });
  }
});

app.post('/log', async (req, res) => {
  try {
    const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];
    const screenshots = Array.isArray(req.body?.screenshots) ? req.body.screenshots : [];

    if (logs.length) {
      const current = safeReadArray('logs.json');
      writeArray('logs.json', current.concat(logs));
      console.log(`✅ Stored ${logs.length} logs (total: ${current.length + logs.length})`);
    }

    if (screenshots.length) {
      const current = safeReadArray('screenshots.json');
      writeArray('screenshots.json', current.concat(screenshots));
      console.log(`✅ Stored ${screenshots.length} screenshots (total: ${current.length + screenshots.length})`);
    }

    if (!logs.length && !screenshots.length) {
      return res.status(200).json({ ok: true, message: 'Nothing to store.' });
    }

    res.status(200).json({ ok: true, message: 'Data stored to JSON files.' });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    res.status(500).json({ ok: false, message: 'Failed to save data.' });
  }
});

app.get('/events-json', (req, res) => {
  try {
    const logs = safeReadArray('logs.json');
    const shots = safeReadArray('screenshots.json');

    const events = [
      ...logs.map(l => ({
        type: 'log',
        uuid: l.sessionId,
        action: l.name,
        timestamp: l.timestamp || 0,
        info: 'button press',
      })),
      ...shots.map(s => ({
        type: 'screenshot',
        uuid: s.sessionId,
        action: s.name,
        timestamp: s.timestamp || 0,
        info: `screenshot base64 length: ${s.screenshot?.length ?? 0}`,
      })),
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(events);
  } catch (e) {
    console.error('❌ Failed to build events feed:', e);
    res.status(500).json({ error: 'Failed to build events feed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
