const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trackerDB';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

const logSchema = new mongoose.Schema({
  sessionId: String,
  name: String,
  timestamp: Number,
});

const screenshotSchema = new mongoose.Schema({
  sessionId: String,
  name: String,
  timestamp: Number,
  screenshot: String, 
});

const Log = mongoose.model('Log', logSchema);
const Screenshot = mongoose.model('Screenshot', screenshotSchema);

app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));

app.post('/log', async (req, res) => {
  try {
    const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];
    const screenshots = Array.isArray(req.body?.screenshots) ? req.body.screenshots : [];

    if (logs.length) {
      await Log.insertMany(logs);
      console.log(`✅ Stored ${logs.length} logs`);
    }

    if (screenshots.length) {
      const normalizedShots = screenshots.map(s => {
        let scr = s.screenshot || s.base64 || "";
        if (scr && !scr.startsWith("data:image/")) {
          scr = `data:image/png;base64,${scr}`;
        }
        return { ...s, screenshot: scr };
      });

      await Screenshot.insertMany(normalizedShots);
      console.log(`✅ Stored ${normalizedShots.length} screenshots`);
    }

    if (!logs.length && !screenshots.length) {
      return res.status(200).json({ ok: true, message: 'Nothing to store.' });
    }

    res.status(200).json({ ok: true, message: 'Data stored in MongoDB.' });
  } catch (error) {
    console.error('❌ Error saving data:', error);
    res.status(500).json({ ok: false, message: 'Failed to save data.' });
  }
});

app.get('/events-json', async (_req, res) => {
  try {
    const logs = await Log.find().lean();
    const shots = await Screenshot.find().lean();

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
        action: s.name || 'screenshot',
        timestamp: s.timestamp || 0,
        screenshot: s.screenshot || s.base64 || "", 
        info: `screenshot base64 length: ${(s.screenshot || s.base64 || "").length}`,
      })),
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.json(events);
  } catch (e) {
    console.error('❌ Failed to fetch events:', e);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/data/screenshots.json', async (_req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'no-store');

    const shots = await Screenshot.find().lean();
    const mapped = shots.map(s => ({
      ...s,
      screenshot: s.screenshot || s.base64 || "", 
    }));

    res.json(mapped);
  } catch (err) {
    console.error('❌ Error serving screenshots:', err);
    res.status(500).json({ ok: false, message: 'Failed to fetch screenshots' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
