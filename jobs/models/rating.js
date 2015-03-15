'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RatingSchema = new Schema({
    user: {type: Schema.ObjectId, ref: 'Account'},
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    rate: {type: Number},
    created_at : {type: Date, default: Date.now},
    modified_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('Rating', RatingSchema);