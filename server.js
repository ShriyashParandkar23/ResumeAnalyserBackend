const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const { resumeAnalyser, jobMatchChecker } = require('./controllers/resume-controller');
require('dotenv').config();
const puppeteer = require("puppeteer");

const youtubeTranscript = require("youtube-transcript");

console.log(youtubeTranscript);


const app = express();

app.use(cors());



const upload = multer({ storage: multer.memoryStorage() });

app.post('/resumeAnalyser', upload.single('resume'), resumeAnalyser);
app.post('/jobMatchChecker',upload.single('resume'), jobMatchChecker)



async function getTranscript(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const YT_INITIAL_PLAYER_RESPONSE_RE =
      /ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+(?:meta|head)|<\/script|\n)/;

    const body = document.documentElement.innerHTML;
    const match = body.match(YT_INITIAL_PLAYER_RESPONSE_RE);
    if (!match) return { error: 'Player response not found' };

    const player = JSON.parse(match[1]);
    const metadata = {
      title: player.videoDetails.title,
      duration: player.videoDetails.lengthSeconds,
      author: player.videoDetails.author,
      views: player.videoDetails.viewCount,
    };

    const tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || !tracks.length) return { error: 'No caption tracks found' };

    // Prefer English non-ASR
    tracks.sort((a, b) => {
      if (a.languageCode === 'en' && b.languageCode !== 'en') return -1;
      if (a.languageCode !== 'en' && b.languageCode === 'en') return 1;
      if (a.kind !== 'asr' && b.kind === 'asr') return -1;
      if (a.kind === 'asr' && b.kind !== 'asr') return 1;
      return 0;
    });

    const baseUrl = tracks[0].baseUrl + '&fmt=json3';
    const response = await fetch(baseUrl);
    const transcript = await response.json();

    const text = transcript.events
      .filter((x) => x.segs)
      .map((x) => x.segs.map((y) => y.utf8).join(' '))
      .join(' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ');

    return {
      metadata,
      transcript: text,
    };
  });

  await browser.close();
  return result;
}

app.get('/transcript/:videoId', async (req, res) => {
  try {
    const result = await getTranscript(req.params.videoId);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to extract transcript' });
  }
});

// Start the server
app.listen(5050, () => {
  console.log('🚀 Server running at http://localhost:5050');
});
