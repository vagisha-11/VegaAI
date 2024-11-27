const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Your User model
const { check, validationResult } = require('express-validator');
const authLogin = require('../middleware/authToken');
const mongoose = require('mongoose');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

mongoose.connect(process.env.MONGODB_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// Register new user
router.post(
	'/register',
	[
		check('username', 'Username is required').not().isEmpty(),
		check('email', 'Please include a valid email').isEmail(),
		check('password', 'Password must be 6 or more characters').isLength({
			min: 6,
		}),
		check('dob', 'Date of birth is required').not().isEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { username, email, password, dob } = req.body;

		try {
			// Check if user exists
			let user = await User.findOne({ email });
			if (user) {
				return res.status(400).json({ msg: 'User already exists' });
			}

			// Create new user
			user = new User({
				username,
				email,
				password,
				dob,
			});

			// Hash the password before saving
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);

			// Save user to database
			await user.save();

			// Generate JWT token
			const payload = {
				user: {
					id: user.id,
				},
			};

			const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });

			// Set token as a HTTP-only cookie
			res.cookie('token', token, {
				httpOnly: true, // Ensure cookie is not accessible via JavaScript
				secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
				sameSite: 'None',
				maxAge: 3 * 60 * 60 * 1000, // Cookie expires in 3 hours
			});

			res.status(200).json({ msg: 'User registered successfully' });
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ msg: 'Server error' });
		}
	}
);

// Login user
router.post(
	'/login',
	[
		check('email', 'Please include a valid email').isEmail(),
		check('password', 'Password is required').exists(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			// Check if user exists
			let user = await User.findOne({ email });
			if (!user) {
				return res.status(400).json({ msg: 'Invalid credentials' });
			}

			// Compare passwords
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res.status(400).json({ msg: 'Invalid credentials' });
			}

			// Generate JWT token
			const payload = {
				user: {
					id: user.id,
				},
			};

			const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3h' });

			// Set token as a HTTP-only cookie
			res.cookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
				sameSite: 'None',
				maxAge: 3 * 60 * 60 * 1000, // Cookie expires in 3 hours
			});

			res.status(200).json({ msg: 'Login successful' });
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server error');
		}
	}
);

// Logout user - clears the cookie
router.post('/logout', (req, res) => {
	res.clearCookie('token'); // Clear the JWT cookie
	res.status(200).json({ msg: 'Logged out successfully' });
});

module.exports = router;
