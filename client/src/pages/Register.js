import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../css/VeggieLogo.png';
import bg from '../css/photobg.mp4';
import '../css/Signup.css';

// Backend URL
const backendUrl =
	process.env.NODE_ENV === 'production'
		? 'https://vegaai.onrender.com/api'
		: 'http://localhost:5000/api';

const Register = () => {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		dob: '',
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const navigate = useNavigate();

	const { username, email, password, dob } = formData;

	const onChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch(backendUrl + '/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include', // Include cookies in the request
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.msg || 'Registration failed.');
			}

			setSuccess('Registration successful!');
			setError('');
			navigate('/'); // Redirect after successful registration
		} catch (err) {
			setError(err.message);
			setSuccess('');
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
					<h1>Register</h1>
					<form onSubmit={onSubmit}>
						<div>
							<label>Username</label>
							<input
								type='text'
								name='username'
								value={username}
								onChange={onChange}
								required
							/>
						</div>
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
						<div>
							<label>Date of Birth</label>
							<input
								placeholder='MM/DD/YYYY'
								type='date'
								name='dob'
								value={dob}
								onChange={onChange}
								required
							/>
						</div>
						<button type='submit'>Register</button>
					</form>
					<h4>
						Already register? Click here to <a href='/login'>Login</a>
					</h4>
				</div>
			</div>
		</div>
	);
};

export default Register;
