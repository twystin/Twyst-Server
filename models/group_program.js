'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GroupProgramSchema = new Schema({
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    count_discount: [{
    	checkin_count : {type: Number},
    	discount: {type: Number}
    }],
    description: {type: String, default:''},
    image: {type: String, default:''},
    created_date: {type: Date, default: Date.now},
    modified_date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('GroupProgram', GroupProgramSchema);