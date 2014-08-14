'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserDataSchema = new Schema({
    phone: {type: String, default: 0},
    number_of_checkins: {type: Number, default: 0},
    last_checkin_mode: {type: String},
    checkins_gt_one: {type:Boolean, default: false},
    cross_visiting_user: {type: Boolean, default: false},
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    program: {type: Schema.ObjectId, ref: 'Program'},
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('UserData', UserDataSchema);