'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BetaMerchantsSchema = new Schema({
    establishment_name: {type: String, trim: true, required: true},
    person_name: {type: String, trim: true, required: true},
    phone_number: {type: String, trim: true, required: true, unique: true},
    email: {type: String, trim: true, required: true},
    city: {type: String, trim: true, required: true},
    created_at : {type: Date, default: Date.now}
});

module.exports = mongoose.model('BetaMerchants', BetaMerchantsSchema);