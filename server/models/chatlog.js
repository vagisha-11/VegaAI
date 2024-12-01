const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	chatSessionId: { type: String, required: true },
	history: [
		{
			role: { type: String, enum: ['user', 'vega'], required: true },
			parts: [
				{
					text: { type: String, required: true },
				},
			],
		},
	],
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chatlog', ChatSchema);
