'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    name: String,
    email: String,
    role: {type: Number, enum: [1,2,3,4,5,6]}, // Refer role_book.js
    company: String,
    address: String,
    contact_person: String,
    phone: {type: String, unique: true},
    website: String,
    facebook_url: String,
    twitter_url: String,
    parent: String, //The logged in user which creates the restricted users
    reset_password_token: String,
    remember: String,
    validated: {
        role_validated: Boolean,
        email_validated: {
            status: {type: Boolean, default: false},
            token: String
        }
    },
    provider: { type: String, default: '' },
    authToken: { type: String, default: '' },
    facebook: {},
    home: {
        latitude: {type: Number},
        longitude: {type: Number}
    },
    gcm: {type: String, default: ''}
});

Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);