// Login.js
import React, { useState } from 'react';
import '../css/Login.css'; // Import your CSS file
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await axios.post(
				'http://localhost:3000/api/auth/login',
				{
					username,
					password,
				},
				{ withCredentials: true }
			);

			if (response.status === 200) {
				const data = response.data;
				alert('Login successful!');
				navigate('/');
			} else {
				alert(`Login failed: ${response.data.error}`);
			}
		} catch (error) {
			alert('An error occurred during login. Please try again later.');
			console.error('Login Error:', error);
		}
	};

	return (
		<form className='login-form' onSubmit={handleSubmit}>
			<h2>Login</h2>
			<input
				type='text'
				placeholder='Username'
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				required
			/>
			<input
				type='password'
				placeholder='Password'
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				required
			/>
			<button type='submit'>Login</button>
		</form>
	);
}

export default Login;
