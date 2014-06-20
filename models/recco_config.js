'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReccoConfigSchema = new Schema({
    USER_CHECKIN_WEIGHT: Number,
    NUMBER_OF_RECCO: Number,
    CHECKIN_CUTOFF_INTERVAL: Number,
    NORMALIZED_WEIGHT: Number,
    OUTLET_POPULARITY_WEIGHT: Number,
    RELEVANCE_MATCH_WEIGHT: Number,
    DISTANCE_WEIGHT: Number
});

module.exports = mongoose.model('ReccoConfig', ReccoConfigSchema);