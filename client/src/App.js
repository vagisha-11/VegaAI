import React, { useState, useRef } from "react";
import CodeBlock from "./Codeblock"; // Ensure this component handles language highlighting
import { marked } from "marked";
import "prismjs/components/prism-javascript"; // JavaScript
import "prismjs/components/prism-python"; // Python
import "prismjs/components/prism-java"; // Java
import "prismjs/components/prism-c"; // C
import "prismjs/components/prism-cpp";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
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
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input field
      }
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

  const extractCodeBlocks = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;

    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }
      parts.push({ type: "code", content: match[2], language: match[1] || "" });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.slice(lastIndex) });
    }

    return parts;
  };

  return (
    <div className="container">
      <h1>Chat with me</h1>

      <div className="chat-container">
        {conversation.map((msg, index) => {
          const parts = extractCodeBlocks(msg.content);
          return (
            <div key={index} className={`message ${msg.role}`}>
              <strong>{msg.role === "user" ? "You" : "Gemini"}:</strong>
              {parts.map((part, i) => {
                if (part.type === "code") {
                  return (
                    <CodeBlock
                      key={i}
                      code={part.content}
                      language={part.language}
                    />
                  );
                } else {
                  return (
                    <div
                      key={i}
                      className="explanation"
                      dangerouslySetInnerHTML={{ __html: marked(part.content) }}
                    />
                  );
                }
              })}
            </div>
          );
        })}
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

      <input type="file" onChange={handleFileChange} ref={fileInputRef} />
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
