const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Configuration for generation
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Function to generate a response for a single question
const generateResponse = async (question, res) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // Stream the response
    const streamResponse = (message) => {
      res.write(`data: ${JSON.stringify({ message })}\n\n`);
    };

    // Simulating progressive streaming
    const responseChunks = [
      "Generating response...",
      "Thinking...",
      "Almost there...",
      "Here is the final response:",
    ];

    // Sending each chunk progressively
    for (const chunk of responseChunks) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay for streaming
      streamResponse(chunk);
    }

    const result = await chatSession.sendMessage(question); // Send the user's message to the model
    streamResponse(result.response.text());

    // End the response stream
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.write(
      `data: ${JSON.stringify({
        message: "An error occurred while processing your request.",
      })}\n\n`
    );
    res.end();
  }
};

// POST endpoint to handle chat
app.post("/", async (req, res) => {
  const userQuestion = req.body.question; // Extract the user's question from the request body

  if (!userQuestion) {
    return res.status(400).json({ error: "Question is required." });
  }

  // Set headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await generateResponse(userQuestion, res); // Pass the response object for streaming
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
