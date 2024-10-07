const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true, // Ensures no duplicate email addresses
			lowercase: true, // Converts email to lowercase before storing
			trim: true, // Removes whitespace from beginning and end
			match: [
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
				'Please enter a valid email address',
			], // Regular expression for basic email validation
		},
		password: {
			type: String,
			required: true,
		},
		dob: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
