import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../css/VeggieLogo.png';
import bg from '../css/photobg.mp4';
import '../css/Login.css';

// Backend URL
const backendUrl =
	process.env.NODE_ENV === 'production'
		? 'https://vegaai.onrender.com/api'
		: 'http://localhost:5000/api';

const Login = () => {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState('');
	const navigate = useNavigate();

	const { email, password } = formData;

	const onChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		try {
			const response = await fetch(backendUrl + '/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include', // Ensure cookies are included in the request
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.msg || 'Login failed.');
			}

			setError('');
			navigate('/'); // Redirect after successful login
		} catch (err) {
			setError(err.message);
		}
	};

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
						<a href='/'>Chat</a>
						<a href='/register'>Signup</a>
					</ul>
				</div>
			</nav>

			<div className='formWrapper'>
				<div>
					<h1>Login</h1>
					<form onSubmit={onSubmit}>
						<div>
							<label>Email</label>
							<input
								type='email'
								name='email'
								value={email}
								onChange={onChange}
								required
							/>
						</div>
						<div>
							<label>Password</label>
							<input
								type='password'
								name='password'
								value={password}
								onChange={onChange}
								required
							/>
						</div>
						<button type='submit'>Login</button>
					</form>
					<h4>
						New User? Click here to <a href='/register'>Signup</a>
					</h4>
				</div>
			</div>
		</div>
	);
};

export default Login;
