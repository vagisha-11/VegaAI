import React, { useState, useRef } from "react";
import CodeBlock from "./Codeblock";
import { marked } from "marked";
import "prismjs/components/prism-javascript";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const chatEndRef = useRef(null);

  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

  const askQuestion = async (trimmedQuestion) => {
    setLoading(true);
    setConversation((prev) => [
      ...prev,
      { role: "user", content: trimmedQuestion },
    ]);

    const formData = new FormData();
    formData.append("question", trimmedQuestion);
    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setConversation((prev) => [
        ...prev,
        { role: "gemini", content: data.answer },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setConversation((prev) => [
        ...prev,
        { role: "gemini", content: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setLoading(false);
      setQuestion("");
      setFile(null); // Reset file after sending
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAskButtonClick = () => {
    const trimmedQuestion = question.trim();
    if (trimmedQuestion) {
      askQuestion(trimmedQuestion);
    } else {
      alert("Please enter a question.");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="container">
      <h1>Chat with me</h1>

      <div className="chat-container">
        {conversation.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Gemini"}:</strong>
            <div dangerouslySetInnerHTML={{ __html: marked(msg.content) }} />
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <textarea
        className="textarea"
        rows="4"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <br />
      <input type="file" onChange={handleFileChange} />
      <br />
      <button
        className="button"
        onClick={handleAskButtonClick}
        disabled={loading}
      >
        {loading ? "Loading..." : "Ask"}
      </button>
    </div>
  );
}

export default App;
