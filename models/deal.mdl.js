/*jslint node: true */
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var business_hours = require("../common/operatingHours");
require('./outlet');
var Outlet = mongoose.model('Outlet');

var DealSchema = new Schema ({
  outlets: [{type: Schema.ObjectId, ref: 'Outlet'}], // if no outlets, then Twyst deal.
  status: {type: String}, // active, etc.
  program: {type: String},
  rule: {
    event_type: {type: String}, // favourite, checkin, etc.
    event_count: {type: String}, // 2,4,6, 0
    event_calc: {type: String}, // template - every, each, etc.
    friendly_text: {type: String}
  },
  actions: {
    reward: { // the reward to generate
      title: {type: String},
      terms: {type: String},
      detail: {type: String},
      expiry: {type: String},
      avaiable_at: business_hours.hours,
    },
    message: {
      sms: {type: String},
      email: {type: String},
      push: {type: String}
    },
    points: {type: Number},
  },
  created_at : {type: Date, default: Date.now}
});

function slugify(detail) {
    return detail.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

DealSchema.pre('validate', function (next) {
    if(!this.detail) next();
    this.slug = slugify(this.actions.reward.detail);
    next();
});

module.exports = mongoose.model('Deal', DealSchema);
