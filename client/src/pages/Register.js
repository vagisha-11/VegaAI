import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
			const response = await fetch(
				'https://vegaai.onrender.com/api/auth/register',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include', // Include cookies in the request
					body: JSON.stringify(formData),
				}
			);

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
		<div>
			<h1>Register</h1>
			{error && <div style={{ color: 'red' }}>{error}</div>}
			{success && <div style={{ color: 'green' }}>{success}</div>}
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
						type='date'
						name='dob'
						value={dob}
						onChange={onChange}
						required
					/>
				</div>
				<button type='submit'>Register</button>
			</form>
		</div>
	);
};

export default Register;
