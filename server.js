const express = require("express");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const app = express();

// Middleware
app.use(bodyParser.json());

// Configure AWS Polly
AWS.config.update({
  region: "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
const polly = new AWS.Polly();

const MAX_TEXT_LENGTH = 2900; // 3000 is max text length

// Split text into chunks
function splitTextIntoChunks(text, maxLength) {
  const regex = new RegExp(`(.{1,${maxLength}})(\\s|$)`, "g");
  return text.match(regex);
}

app.post("/synthesize", async (req, res) => {
  const { text } = req.body;

  const chunks = splitTextIntoChunks(text, MAX_TEXT_LENGTH);
  const audioBuffers = [];

  // Synthesize each chunk
  for (const chunk of chunks) {
    const params = {
      OutputFormat: "mp3",
      Text: chunk,
      VoiceId: "Matthew",
    };

    try {
      const pollyResponse = await polly.synthesizeSpeech(params).promise();
      if (pollyResponse.AudioStream) {
        audioBuffers.push(pollyResponse.AudioStream);
      }
    } catch (err) {
      console.error("Error with Polly:", err);
      return res.status(500).json({ error: "Error with Polly request" });
    }
  }

  // Combine all audio streams into one and send the response
  const combinedAudioBuffer = Buffer.concat(audioBuffers);
  res.setHeader("Content-Type", "audio/mpeg");
  res.send(combinedAudioBuffer);
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
