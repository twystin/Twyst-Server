'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SocialSchema = new Schema({
    facebook: {

    },
    google: {

    },
    logged_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Social', SocialSchema);