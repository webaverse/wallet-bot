const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const WalletSchema = new Schema({
	user_id: {type: String, required: false, default: ''},
	name: {type: String, required: false, default: ''},
	discri: {type: String, required: false, default: ''},
	last_updated: {type: Date, required: true},
	role: {type: Array, required: false, default: []},
	wallet: {type: String, required: false, default: ''},
}, {collection: 'Wallets'})

module.exports = mongoose.model('WalletModel', WalletSchema);
