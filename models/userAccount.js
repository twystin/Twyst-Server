'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var userAccount = new Schema({
	name: String,
    email: String,
    phone: {type: String, unique: true},
    role: {type: Number, default: 6}, // Refer role_book.js
    social_graph: {
    	provider: {
    		facebook: {

    		},
    		google: {

    		}
    	}
    },
    home: {
        latitude: {type: Number},
        longitude: {type: Number}
    },
    gcm: {type: String, default: ''},
    device_id: {type: String, default: ''},
    otp: String,
    otp_validated: Boolean
});

module.exports = mongoose.model('userAccount', userAccount);