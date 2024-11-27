import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
			const response = await fetch(
				'http://vegaai.onrender.com/api/auth/login',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include', // Ensure cookies are included in the request
					body: JSON.stringify(formData),
				}
			);

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
		<div>
			<h1>Login</h1>
			{error && <div style={{ color: 'red' }}>{error}</div>}
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
		</div>
	);
};

export default Login;
