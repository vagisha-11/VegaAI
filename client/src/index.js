import React from "react";
import ReactDOM from "react-dom/client"; // Import the modern createRoot
import "./index.css";
import MainApp from "./App"; // Ensure you're importing MainApp
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root")); // Use createRoot to create the root
root.render(
  <React.StrictMode>
    <MainApp /> 
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
