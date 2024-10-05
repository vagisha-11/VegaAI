import React, { useEffect, useRef } from "react";
import Prism from "prismjs";
import ClipboardJS from "clipboard";
import "prismjs/themes/prism-tomorrow.css"; // Import Prism.js theme CSS
import "./Codeblock.css"; // Custom styles

const CodeBlock = ({ code, language }) => {
  const codeRef = useRef(null);

  useEffect(() => {
    Prism.highlightAll(); // Highlight the code block

    // Initialize ClipboardJS
    const clipboard = new ClipboardJS(".copy-btn", {
      target: () => codeRef.current,
    });

    return () => {
      clipboard.destroy(); // Clean up ClipboardJS instance
    };
  }, [code, language]); // Re-run when code or language changes

  return (
    <div className="code-block">
      <pre>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
      <button className="copy-btn" data-clipboard-target={`#code-snippet`}>
        Copy
      </button>
    </div>
  );
};

export default CodeBlock;
