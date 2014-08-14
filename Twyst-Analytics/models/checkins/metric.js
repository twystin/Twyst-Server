'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CheckinMetricSchema = new Schema({
    outlet: {type: Schema.ObjectId, ref: 'Outlet'},
    program: {type: Schema.ObjectId, ref: 'Program'},
    total_checkins: {type: Number, default: 0},
    avg_daily_checkins: {type: Number, default: 0},
    count_by_checkin_type: [{
        _id: String,
        count: Number
    }],
    count_by_checkin_location: [{
        _id: String,
        count: Number
    }],
    avg_daily_checkins_by_day_of_week: [{
    		_id: String, 
    		value: Number
    	}
    ],
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('CheckinMetric', CheckinMetricSchema);