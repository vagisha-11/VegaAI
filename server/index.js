const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Setup multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limit file size to 1MB
  fileFilter: (req, file, cb) => {
    const filetypes = /txt|json|csv/; // Allowed file types
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb("Error: File type not supported!");
  },
});

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
const generateResponse = async (question, fileContent, res) => {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // Process the file content if it exists
    const message = fileContent ? `${fileContent}\n${question}` : question;

    const result = await chatSession.sendMessage(message);
    res.json({ answer: result.response.text() });
  } catch (error) {
    console.error("Error:", error);
    res.json({ answer: "An error occurred while processing your request." });
  }
};

// POST endpoint to handle chat with file upload
app.post("/", upload.single("file"), async (req, res) => {
  const userQuestion = req.body.question; // Extract the user's question from the request body
  const file = req.file; // Extract the uploaded file

  if (!userQuestion) {
    return res.status(400).json({ error: "Question is required." });
  }

  // Read file content if available
  let fileContent = "";
  if (file) {
    fileContent = file.buffer.toString(); // Convert buffer to string (for example, a text file)
  }

  try {
    await generateResponse(userQuestion, fileContent, res); // Pass the file content to the response generator
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
