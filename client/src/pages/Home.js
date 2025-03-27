import React, { useState, useRef, useEffect } from 'react';
import CodeBlock from '../Components/Codeblock';
import { marked } from 'marked';
import SpeechRecognition, {
	useSpeechRecognition,
} from 'react-speech-recognition';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import '../css/Home.css';
import logo from '../css/VeggieLogo.png';
import bg from '../css/photobg.mp4';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBars,
	faMagnifyingGlass,
	faPaperclip,
	faCircleXmark,
	faRocket,
	faHourglassStart,
	faMicrophone,
	faMicrophoneSlash,
	faVolumeHigh,
	faVolumeXmark,
	faPen,
} from '@fortawesome/free-solid-svg-icons';

function Home() {
	// States
	const [question, setQuestion] = useState('');
	const [conversation, setConversation] = useState([]);
	const [loading, setLoading] = useState(false);
	const [file, setFile] = useState(null);
	const [isTTSActive, setIsTTSActive] = useState(false);
	const [error, setError] = useState('');
	const [isLoggedIn, setIsLoggedIn] = useState(true);
	const [username, setUsername] = useState('');
	const [chatSessions, setChatSessions] = useState([]);
	const [selectedSessionHistory, setSelectedSessionHistory] = useState([]);

	// Refs
	const fileInputRef = useRef(null);
	const chatEndRef = useRef(null);
	const chatHistoryRef = useRef([]);
	const {
		transcript,
		listening,
		resetTranscript,
		browserSupportsSpeechRecognition,
	} = useSpeechRecognition();

	// Backend URL
	const backendUrl =
		process.env.NODE_ENV === 'production'
			? 'https://vegaai.onrender.com/api'
			: 'http://localhost:5000/api';

	// Function to fetch chat sessions
	useEffect(() => {
		const fetchChatSessions = async () => {
			if (isLoggedIn) {
				try {
					const response = await fetch(backendUrl + '/chat/history', {
						method: 'GET',
						credentials: 'include',
					});

					if (response.ok) {
						const data = await response.json();
						setChatSessions(data.chatHistory);
					} else {
						console.error('Failed to fetch chat sessions');
					}
				} catch (err) {
					console.error('Error fetching chat sessions:', err);
				}
			}
		};
		fetchChatSessions();
	}, [isLoggedIn]);

	// Function to fetch session history
	const fetchSessionHistory = async (sessionId) => {
		try {
			const response = await fetch(backendUrl + `/chat/history/${sessionId}`, {
				method: 'GET',
				credentials: 'include',
			});

			if (response.ok) {
				const data = await response.json();
				setSelectedSessionHistory(data.history);
			} else {
				console.error('Failed to fetch session history');
			}
		} catch (err) {
			console.error('Error fetching session history:', err);
		}
	};

	// Function to start and stop listening
	const startListening = () => {
		SpeechRecognition.startListening({ continuous: true });
	};

	const stopListening = () => {
		SpeechRecognition.stopListening();
		setQuestion(transcript);
		resetTranscript();
	};

	// Function to push history
	const pushHistory = (role, message) => {
		chatHistoryRef.current.push({ role, parts: [{ text: message }] });
	};

	// Function to ask question, fetch response and update conversation history
	const askQuestion = async (trimmedQuestion) => {
		setLoading(true);
		setConversation((prev) => [
			...prev,
			{ role: 'user', content: trimmedQuestion },
		]);
		pushHistory('user', trimmedQuestion);

		const formData = new FormData();
		formData.append('question', trimmedQuestion);
		if (file) formData.append('file', file);

		try {
			const response = await fetch(backendUrl + '/chat', {
				method: 'POST',
				body: formData,
				credentials: 'include', // Send cookies for authentication
			});

			if (!response.ok)
				throw new Error(`HTTP error! Status: ${response.status}`);

			// Reading streamed response chunk by chunk
			const reader = response.body.getReader();
			const decoder = new TextDecoder(); // decodes bytes into strings
			let responseText = '';
			let done = false;
			let firstChunkReceived = false;

			// Simulate typing effect
			const simulateTyping = async (text) => {
				for (let i = 0; i < text.length; i++) {
					responseText += text[i];
					await new Promise((resolve) => setTimeout(resolve, 20));
					setConversation((prev) => {
						const updatedMessages = [...prev];
						const lastVegaIndex = updatedMessages
							.reverse()
							.findIndex((msg) => msg.role === 'vega');
						if (lastVegaIndex !== -1) {
							updatedMessages[lastVegaIndex].content = responseText;
						}
						return updatedMessages.reverse();
					});
					chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
				}
			};

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;

				const chunkText = decoder.decode(value, { stream: true });

				if (!firstChunkReceived) {
					setConversation((prev) => [...prev, { role: 'vega', content: '' }]);
					firstChunkReceived = true;
				}

				await simulateTyping(chunkText);
			}

			pushHistory('vega', responseText);
			if (isTTSActive) speakOutLoud(responseText);
		} catch (error) {
			console.error('Error:', error);
			setConversation((prev) => [
				...prev,
				{ role: 'vega', content: "Sorry, I couldn't process your request." },
			]);
		} finally {
			setLoading(false);
			setQuestion('');
			setFile(null);
			if (fileInputRef.current) fileInputRef.current.value = '';
			chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	};

	// Function to extract code blocks from text
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

	// Function to speak out loud
	const speakOutLoud = (text) => {
		const synth = window.speechSynthesis;
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.voice = synth.getVoices().find((voice) => voice.lang === 'en-US');
		synth.speak(utterance);
	};

	// Function to handle textarea resize
	const handleTextareaResize = (textarea) => {
		const lineHeight = 30;
		const maxLines = 4;
		const baseHeight = 30;
		textarea.style.height = 'auto';
		const lines = Math.min(
			maxLines,
			Math.ceil(textarea.scrollHeight / lineHeight)
		);
		textarea.style.height = `${baseHeight + (lines - 1) * lineHeight}px`;
	};

	// Function to change the file input
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
				if (fileInputRef.current) fileInputRef.current.value = '';
				return;
			}

			if (uploadedFile.size > maxSizeInMB * 1024 * 1024) {
				setFile(null);
				setError(`File size should not exceed ${maxSizeInMB} MB.`);
				if (fileInputRef.current) fileInputRef.current.value = '';
				return;
			}

			setFile(uploadedFile);
			setError('');
		}
	};

	const handleRemoveFile = () => {
		setFile(null);
		setError('');
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const toggleTTS = () => setIsTTSActive((prev) => !prev);

	const handleAskButtonClick = () => {
		const trimmedQuestion = question.trim();
		if (trimmedQuestion) askQuestion(trimmedQuestion);
		else alert('Please enter a question.');
	};

	// Checking login status on loading the page
	useEffect(() => {
		const checkLoginStatus = async () => {
			try {
				const response = await fetch(backendUrl + '/auth/check-login', {
					method: 'GET',
					credentials: 'include',
				});

				if (response.ok) {
					const data = await response.json();
					setIsLoggedIn(true);
					setUsername(data.user.username);
				} else {
					setIsLoggedIn(false);
					setUsername('');
				}
			} catch (err) {
				console.error('Error checking login status:', err);
				setIsLoggedIn(false);
				setUsername('');
			}
		};
		checkLoginStatus();
	}, []);

	// Saving chat history on page unload
	useEffect(() => {
		const handleBeforeUnload = (e) => {
			const historyToSave = chatHistoryRef.current;
			if (historyToSave.length > 0) {
				navigator.sendBeacon(
					backendUrl + '/chat/save-history',
					JSON.stringify({ history: historyToSave })
				);
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const handleLogout = async () => {
		try {
			const response = await fetch(backendUrl + '/auth/logout', {
				method: 'POST',
				credentials: 'include',
			});

			if (response.ok) {
				setIsLoggedIn(false);
				setUsername('');
				setChatSessions([]);
				setSelectedSessionHistory([]);
				setConversation([]);
				alert('You have been logged out!');
			} else {
				console.error('Failed to log out');
			}
		} catch (err) {
			console.error('Error logging out:', err);
		}
	};

	if (!browserSupportsSpeechRecognition) {
		return <div>Your browser does not support speech recognition.</div>;
	}

	return (
		<div className='app-container'>
			<video className='video-background' autoPlay muted loop>
				<source src={bg} type='video/mp4' />
				Your browser does not support the video tag.
			</video>

			<nav className='navbar'>
				<a className='logoDiv' href='/'>
					<div className='navbar-logo'>
						<img src={logo} alt='Veggie Logo' />
					</div>
					<h1>VEGA AI</h1>
				</a>
				<div className='auth'>
					<ul>
						{isLoggedIn ? (
							<>
								<li>
									<span>Welcome, {username}</span>
								</li>
								<li>
									<a onClick={handleLogout}>Logout</a>
								</li>
							</>
						) : (
							<>
								<li>
									<a href='/login'>Login</a>
								</li>
								<li>
									<a href='/register'>Signup</a>
								</li>
							</>
						)}
					</ul>
				</div>
			</nav>

			<div style={{ display: 'flex', flex: '1' }}>
				<aside className='history'>
					<div className='hisTitle'>
						<h3
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<FontAwesomeIcon icon={faBars} />
							<p
								style={{
									margin: '0px 15px',
									textAlign: 'center',
									paddingBottom: '2px',
								}}
							>
								Your History
							</p>
						</h3>
						<a href='/'>
							<h4>
								<FontAwesomeIcon icon={faPen} />
							</h4>
						</a>
					</div>
					<div className='historyContent'>
						{chatSessions.length > 0 ? (
							chatSessions.map((session) => (
								<div
									key={session.chatSessionId}
									onClick={() => fetchSessionHistory(session.chatSessionId)}
									className='historySes'
								>
									<p>
										<strong>Session:</strong> {session.chatSessionId}
									</p>
									<p>
										<strong>Date:</strong>{' '}
										{new Date(session.createdAt).toLocaleString()}
									</p>
								</div>
							))
						) : (
							<p>No chat sessions available.</p>
						)}
					</div>
					{chatSessions.length > 0 ? (
						<div style={{ color: 'white', margin: '10px' }}>
							Click on a session to view Chat History
						</div>
					) : (
						<></>
					)}
				</aside>

				<main className='main-content'>
					{selectedSessionHistory.length > 0 ? (
						<header className='header'>
							<h1>Chat History</h1>
						</header>
					) : (
						<header className='header'>
							<h1>How may I help you?</h1>
						</header>
					)}

					<div className='chat-container'>
						{selectedSessionHistory.length > 0
							? selectedSessionHistory.map((msg, index) => (
									<div key={index} className={`message ${msg.role}`}>
										<strong>{msg.role === 'user' ? 'You' : 'Vega'}:</strong>
										<p>{msg.parts.map((part) => part.text).join(' ')}</p>
									</div>
							  ))
							: conversation.map((msg, index) => {
									const parts = extractCodeBlocks(msg.content);
									return (
										<div key={index} className={`message ${msg.role}`}>
											<strong>{msg.role === 'user' ? 'You' : 'Vega'}:</strong>
											{parts.map((part, i) =>
												part.type === 'code' ? (
													<CodeBlock
														key={i}
														code={part.content}
														language={part.language}
													/>
												) : (
													<div
														key={i}
														className='explanation'
														dangerouslySetInnerHTML={{
															__html: marked(part.content),
														}}
													/>
												)
											)}
										</div>
									);
							  })}
						<div ref={chatEndRef} />
					</div>

					<div style={{ display: 'flex', alignItems: 'end', width: '95%' }}>
						<div className='prompt'>
							<textarea
								className='textarea'
								rows='1'
								value={question}
								placeholder='Ask VEGA :)'
								onChange={(e) => {
									setQuestion(e.target.value);
									handleTextareaResize(e.target);
								}}
							/>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									flexGrow: '1',
									backgroundColor: 'white',
									width: '100%',
								}}
							>
								<div style={{ display: 'flex' }}>
									<h2
										onClick={() => fileInputRef.current?.click()}
										className='icons'
									>
										<FontAwesomeIcon icon={faPaperclip} />
									</h2>
									<h2
										onClick={listening ? stopListening : startListening}
										className='icons'
									>
										{listening ? (
											<FontAwesomeIcon icon={faMicrophoneSlash} />
										) : (
											<FontAwesomeIcon icon={faMicrophone} />
										)}
									</h2>
								</div>
								<h2
									onClick={handleAskButtonClick}
									disabled={loading}
									className='icons'
									style={{ margin: '0px' }}
								>
									{loading ? (
										<FontAwesomeIcon icon={faHourglassStart} />
									) : (
										<FontAwesomeIcon icon={faRocket} />
									)}
								</h2>
							</div>
						</div>
						<h2
							className='icons'
							onClick={toggleTTS}
							style={{
								backgroundColor: 'white',
								color: '#001e45',
								marginBottom: '10px',
								marginLeft: '10px',
							}}
						>
							{isTTSActive ? (
								<FontAwesomeIcon icon={faVolumeXmark} />
							) : (
								<FontAwesomeIcon icon={faVolumeHigh} />
							)}
						</h2>
					</div>

					{file && (
						<p style={{ margin: '0px 5px' }}>
							Selected file:{' '}
							<strong style={{ margin: '0px 5px', marginRight: '10px' }}>
								{file.name}
							</strong>
							<span
								style={{ fontSize: 'small', cursor: 'pointer' }}
								onClick={handleRemoveFile}
							>
								<FontAwesomeIcon icon={faCircleXmark} />
							</span>
						</p>
					)}

					<input
						type='file'
						onChange={handleFileChange}
						ref={fileInputRef}
						style={{ display: 'none' }}
					/>

					{error && <div className='error'>{error}</div>}
				</main>
			</div>
		</div>
	);
}

export default Home;
