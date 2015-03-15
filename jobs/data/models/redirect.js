'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RedirectSchema = new Schema({
    key: {type: String},
    url: {type: String},
    logged_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Redirect', RedirectSchema);