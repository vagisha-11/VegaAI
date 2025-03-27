// Logout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Backend URL
const backendUrl =
	process.env.NODE_ENV === 'production'
		? 'https://vegaai.onrender.com/api'
		: 'http://localhost:5000/api';

const Logout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const logoutUser = async () => {
			try {
				// Make the POST request to the logout endpoint using fetch
				const response = await fetch(backendUrl + '/auth/logout', {
					method: 'POST',
					credentials: 'include', // Include cookies to clear the JWT token
				});

				if (response.ok) {
					navigate('/login'); // Redirect to login page after successful logout
				} else {
					console.error('Failed to log out');
				}
			} catch (err) {
				console.error('Error logging out:', err);
			}
		};

		logoutUser();
	}, [navigate]);

	return (
		<div>
			<h1>Logging out...</h1>
		</div>
	);
};

export default Logout;
