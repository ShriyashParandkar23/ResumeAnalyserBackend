const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { OpenAI } = require("openai");
const {
  resumeAnalyser,
  jobMatchChecker,
} = require("./controllers/resume-controller");
require("dotenv").config();
const puppeteer = require("puppeteer");
const {
  chat_with_youtube_video,
} = require("./controllers/chat-with-youtube-video");

const app = express();

app.use(cors(

));
app.use(express.json()); // <== this is what you're missing


app.get('/',(req,res)=>{
  res.send('Hello world')
})
const upload = multer({ storage: multer.memoryStorage() });

app.post("/resumeAnalyser", upload.single("resume"), resumeAnalyser);
app.post("/jobMatchChecker", upload.single("resume"), jobMatchChecker);
app.post("/chatWithVideo", chat_with_youtube_video);

// Start the server
const PORT = process.env.PORT || 3000;

// Make sure Express listens on 0.0.0.0, not just localhost
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
