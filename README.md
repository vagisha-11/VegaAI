
# AI Chat Platform
Welcome to the AI Chat Platform! This project provides users with an AI assistant powered by the Gemini API, offering features such as text-to-speech, speech-to-text, file uploads, chat history preservation, user registration and login, and formatted code snippet display.


# Deployed Link
### Note:Login/Register to get responses
https://vega-ai-theta.vercel.app/






# Features

##  Navigation
* The platform allows seamless navigation across functionalities such as chat interaction, file upload, and chat history.
## Chat Functionality
* Users can type queries and receive real-time responses from AI.
* Responses are streamed back in chunks for instant feedback.
## Code Snippets
* AI responses containing code are displayed with syntax highlighting.
* Users can copy individual code snippets with a single click.
## File Upload
* Attach files (up to 20 MB) in supported formats to enhance your queries.
## Voice Chat
* Enable speech recognition to ask questions by speaking.
* Use text-to-speech for hands-free response playback.
## Authentication
* Register, log in, and manage sessions securely.
* Only authenticated users can view their chat history.
# Functionality Description

## 1. Basic Chat Functionality:

* Users can type questions and interact with AI in real-time.
* Questions are sent to the backend via the askQuestion function, which also updates the conversation history.
* Responses from the AI are streamed back to the frontend in chunks for real-time experience.


## 2. Code Snippet Display
* Added a CodeBlock component to display and copy code snippets easily.
* Each code block includes a "Copy" button for convenience.

## 3. Real-Time Response Streaming
* AI-generated responses are streamed back in chunks, allowing users to see responses as they are generated, reducing wait times.
## 4. File Upload Support
* Users can upload files (plain text, CSV, JSON, or PDF) as part of their query.
* The system validates file type and size (up to 20 MB) and notifies users of errors instantly.

## 5. Voice Chat Integration
* Users can interact with the platform using speech recognition and text-to-speech (TTS) features.
* The browser’s SpeechSynthesis API is used for TTS to read AI responses aloud.
* Includes a toggle to enable/disable TTS for hands-free interaction.

## 6. Secure User Authentication
* Provides secure user registration and login functionality.
* User credentials are hashed with bcrypt and stored in MongoDB.
* JWT-based session management ensures secure communication.
* Tokens are set to expire after 3 hours to balance security and usability.
## 7. Chat History Preservation
* User conversations are saved to a database for future reference.
* Authenticated users can retrieve and view their chat history.
* Access control ensures that only authorized users can access their data, maintaining privacy.

# Technologies Used



 * React

 * Node.js
  * MongoDB
  * Express.js
  * HTML
  * CSS
  * JS 


# Deployment

1. Clone the repository

2. Install Dependencies

```bash
  npm install
```

3. Set up environment variables:

 1. Create a .env file in the root directory.
 2. Add the following keys:
 ```bash 
    MONGO_URI=<your-mongo-db-connection-string>
    JWT_SECRET=<your-jwt-secret>
    GEMINI_API_KEY=<your-gemini-api-key>
```

4. Start the development server:


```bash
  cd client
  npm install
  npm start
```

5. Start the backend server:

```bash
  cd server
  npm install
  npx nodemon index.js
```
# Authors

- [Vagisha Shrivastava](https://github.com/vagisha-11)
- [Ayush Wani](https://github.com/AyushWani11)

