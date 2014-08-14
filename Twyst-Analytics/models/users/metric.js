'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserMetricSchema = new Schema({
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    program: {type: Schema.ObjectId, ref: 'Program'},
    total_users: {type: Number, default: 0},
    total_users_with_checkins_gt_one: {type: Number, default: 0},
    cross_visiting_users: {type: Number, default: 0},
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('UserMetric', UserMetricSchema);