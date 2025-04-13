const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
const { resumeAnalyser, jobMatchChecker } = require('./controllers/resume-controller');
require('dotenv').config();

const app = express();

app.use(cors());



const upload = multer({ storage: multer.memoryStorage() });

app.post('/resumeAnalyser', upload.single('resume'), resumeAnalyser);
app.post('/jobMatchChecker',upload.single('resume'), jobMatchChecker)



// Start the server
app.listen(5050, () => {
  console.log('🚀 Server running at http://localhost:5050');
});
