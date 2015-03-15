'use strict';
var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Schema = mongoose.Schema;


var QrSchema = new Schema({
    code: {type: String, required: true},
    outlet_id: {type: Schema.ObjectId, ref: 'Outlet'},
    max_use_limit: {type: Number, required: true},
    type: {type: String, enum:['single', 'multi']},
    times_used: {type: Number, default: 0},
    validity: {
        start: {type: Date, default: Date.now},
        end: {type: Date, default: Date.now}
    },
    created_date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Qr', QrSchema);