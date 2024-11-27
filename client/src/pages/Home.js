import React, { useState, useRef, useEffect } from 'react';
import CodeBlock from '../Components/Codeblock'; // Ensure this component handles language highlighting
import { marked } from 'marked';
import 'prismjs/components/prism-javascript'; // JavaScript
import 'prismjs/components/prism-python'; // Python
import 'prismjs/components/prism-java'; // Java
import 'prismjs/components/prism-c'; // C
import 'prismjs/components/prism-cpp'; // C++
import SpeechRecognition, {
	useSpeechRecognition,
} from 'react-speech-recognition';
import '../css/Home.css';
import logo from '../css/VeggieLogo.png';

function Home() {
	const [question, setQuestion] = useState('');
	const [conversation, setConversation] = useState([]);
	const [loading, setLoading] = useState(false);
	const [file, setFile] = useState(null);
	const [isTTSActive, setIsTTSActive] = useState(false);
	const [error, setError] = useState('');
	const fileInputRef = useRef(null);
	const chatEndRef = useRef(null);

	const {
		transcript,
		listening,
		resetTranscript,
		browserSupportsSpeechRecognition,
	} = useSpeechRecognition();
	const backendUrl = 'http://localhost:5000/api/chat';

	//Speech-to-text
	const startListening = () => {
		SpeechRecognition.startListening({ continuous: true });
	};

	const stopListening = () => {
		SpeechRecognition.stopListening();
		setQuestion(transcript);
		resetTranscript();
	};

	const chatHistoryRef = useRef([]);

	function pushHistory(role, message) {
		chatHistoryRef.current.push({
			role: role, // e.g., 'user' or 'model'
			parts: [{ text: message }],
		});
	}

	// function to ask question
	const askQuestion = async (trimmedQuestion) => {
		setLoading(true);
		setConversation((prev) => [
			...prev,
			{ role: 'user', content: trimmedQuestion },
		]);
		pushHistory('user', trimmedQuestion);

		const formData = new FormData();
		formData.append('question', trimmedQuestion);
		if (file) {
			formData.append('file', file);
		}

		try {
			const response = await fetch(backendUrl, {
				method: 'POST',
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			// Streaming the response text
			const reader = response.body.getReader();
			let decoder = new TextDecoder();
			let responseText = '';
			let done = false;
			let firstChunkReceived = false; // Track whether the first chunk has been received

			// Create a helper function to simulate typing effect
			const simulateTyping = async (text) => {
				for (let i = 0; i < text.length; i++) {
					const currentChar = text[i];
					responseText += currentChar;
					await new Promise((resolve) => setTimeout(resolve, 20)); // Typing speed
					setConversation((prev) => {
						const updatedMessages = [...prev];
						const lastGeminiMessageIndex = updatedMessages
							.reverse()
							.findIndex((msg) => msg.role === 'gemini');
						if (lastGeminiMessageIndex !== -1) {
							updatedMessages[lastGeminiMessageIndex].content = responseText;
						}
						return updatedMessages.reverse(); // Reverse back the array
					});

					chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
				}
			};

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;

				// Decode the chunk and append it to the response
				const chunkText = decoder.decode(value, { stream: true });

				// If the first chunk is received, create a new 'gemini' message block
				if (!firstChunkReceived) {
					setConversation((prev) => [
						...prev,
						{ role: 'gemini', content: '' }, // Create an empty block for the response
					]);
					firstChunkReceived = true; // Mark that the block has been created
				}

				// Simulate typing the chunk received
				await simulateTyping(chunkText);
			}

			pushHistory('gemini', responseText);

			if (isTTSActive) {
				speakOutLoud(responseText);
			}
		} catch (error) {
			console.error('Error:', error);
			setConversation((prev) => [
				...prev,
				{ role: 'gemini', content: "Sorry, I couldn't process your request." },
			]);
		} finally {
			setLoading(false);
			setQuestion('');
			setFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
			chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const handleAskButtonClick = () => {
		const trimmedQuestion = question.trim();
		if (trimmedQuestion) {
			askQuestion(trimmedQuestion);
		} else {
			alert('Please enter a question.');
		}
	};

	//file upload
	const handleFileChange = (e) => {
		const uploadedFile = e.target.files[0];
		const validTypes = [
			'text/plain',
			'text/csv',
			'application/json',
			'application/pdf',
		];
		const maxSizeInMB = 20;

		if (uploadedFile) {
			if (!validTypes.includes(uploadedFile.type)) {
				setFile(null);
				setError('File type not supported. Please upload a valid file.');
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
				return;
			}

			if (uploadedFile.size > maxSizeInMB * 1024 * 1024) {
				setFile(null);
				setError(`File size should not exceed ${maxSizeInMB} MB.`);
				if (fileInputRef.current) {
					fileInputRef.current.value = '';
				}
				return;
			}

			setFile(uploadedFile);
			setError('');
		}
	};

	// Separating code Blocks from normal responses
	const extractCodeBlocks = (text) => {
		const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
		const parts = [];
		let lastIndex = 0;

		let match;
		while ((match = codeBlockRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push({
					type: 'text',
					content: text.slice(lastIndex, match.index),
				});
			}
			parts.push({ type: 'code', content: match[2], language: match[1] || '' });
			lastIndex = codeBlockRegex.lastIndex;
		}

		if (lastIndex < text.length) {
			parts.push({ type: 'text', content: text.slice(lastIndex) });
		}

		return parts;
	};

	// Text- to -speech
	const speakOutLoud = (text) => {
		const synth = window.speechSynthesis;
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.voice = synth.getVoices().find((voice) => voice.lang === 'en-US');
		synth.speak(utterance);
	};

	const toggleTTS = () => {
		setIsTTSActive((prev) => !prev);
	};

	useEffect(() => {
		const handleBeforeUnload = (e) => {
			const historyToSave = chatHistoryRef.current;
			if (historyToSave.length > 0) {
				// Use sendBeacon to send the chat history asynchronously before the page unloads
				navigator.sendBeacon(
					'http://localhost:5000/api/chat/save-history',
					JSON.stringify({ history: historyToSave })
				);
			}
		};

		// Add the event listener when the component mounts
		window.addEventListener('beforeunload', handleBeforeUnload);

		// Clean up the event listener when the component unmounts
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, []); // Empty dependency array ensures this runs only once on mount

	if (!browserSupportsSpeechRecognition) {
		return <div>Your browser does not support speech recognition.</div>;
	}

	return (
		<div className='app-container'>
			<aside className='sidebar'>
				<div className='sidebar-logo'>
					<img src={logo} alt='Veggie Logo' />
				</div>
				<h1>VEGA AI</h1>
				<nav className='sidebar-nav'>
					<ul>
						<li>
							<a href='/'>Chat</a>
						</li>
						<li>History</li>
						<li>Settings</li>
						<li>Help</li>
					</ul>
				</nav>

				<div className='auth'>
					<ul>
						<li>
							{' '}
							<a href='/login'>Login</a>
						</li>
						<li>
							<a href='/register'>Signup</a>
						</li>
					</ul>
				</div>
			</aside>

			<main className='main-content'>
				<header className='header'>
					<h1>How may I help you?</h1>
				</header>

				<div className='chat-container'>
					{conversation.map((msg, index) => {
						const parts = extractCodeBlocks(msg.content);
						return (
							<div key={index} className={`message ${msg.role}`}>
								<strong>{msg.role === 'user' ? 'You' : 'Gemini'}:</strong>
								{parts.map((part, i) => {
									if (part.type === 'code') {
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
												className='explanation'
												dangerouslySetInnerHTML={{
													__html: marked(part.content),
												}}
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
					className='textarea'
					rows='4'
					placeholder='Ask a question...'
					value={question}
					onChange={(e) => setQuestion(e.target.value)}
				/>
				<br />

				<input type='file' onChange={handleFileChange} ref={fileInputRef} />

				{error && <div className='error'>{error}</div>}

				<div className='voice-controls'>
					<button onClick={startListening} disabled={loading || listening}>
						{listening ? 'Listening...' : 'Start Voice Chat'}
					</button>
					<button onClick={stopListening} disabled={!listening}>
						Stop Voice Chat
					</button>
				</div>

				<button
					className='button'
					onClick={handleAskButtonClick}
					disabled={loading}
				>
					{loading ? 'Loading...' : 'Ask'}
				</button>

				{/* Text-to-Speech Toggle Button */}
				<button className='button tts-toggle' onClick={toggleTTS}>
					{isTTSActive ? 'Disable Voice Response' : 'Enable Voice Response'}
				</button>
			</main>
		</div>
	);
}

export default Home;
