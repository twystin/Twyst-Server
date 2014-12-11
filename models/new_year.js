'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NewYearSchema = new Schema({
    email: {type: String, trim: true},
    phone: {type: String, trim: true},
    name: {type: String, trim: true},
    dob: {type: Date, trim: true},
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('NewYear', NewYearSchema);