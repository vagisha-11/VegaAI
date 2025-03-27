const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Your User model

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const authLogin = async (req, res, next) => {
	try {
		// Get token from cookies
		const token = req.cookies.token;
		console.log('Token:', token);
		if (!token) {
			return res.status(401).json({ msg: 'No token, authorization denied' });
		}

		// Verify token
		const decoded = jwt.verify(token, JWT_SECRET);
		req.user = decoded.user; // Attach user ID from token payload

		// Fetch the user from the database to include username
		const user = await User.findById(req.user.id).select('username email');
		if (!user) {
			return res.status(404).json({ msg: 'User not found' });
		}

		req.user.username = user.username; // Add username to req.user
		req.user.email = user.email; // Add email if needed
		next();
	} catch (err) {
		console.error(err.message);
		res.status(401).json({ msg: 'Token is not valid' });
	}
};

module.exports = authLogin;
