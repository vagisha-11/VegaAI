// Logout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const logoutUser = async () => {
			try {
				// Make the POST request to the logout endpoint using fetch
				const response = await fetch('http://localhost:5000/api/auth/logout', {
					method: 'POST',
					credentials: 'include', // Include cookies to clear the JWT token stored as a cookie
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

		logoutUser(); // Call the logout function when component mounts
	}, [navigate]);

	return (
		<div>
			<h1>Logging out...</h1>
		</div>
	);
};

export default Logout;
