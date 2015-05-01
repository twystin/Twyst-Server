'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
  avail_hours = require("../common/operatingHours");

var CouponSchema = new Schema({
  basics: {
    code: {
      type: String,
      trim: true,
      required: true,
      unqiue: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'redeemed_by_user', 'redeemed_by_merchant'],
      default: 'active'
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    modified_at: {
      type: Date,
      default: Date.now
    }
  },
  validity: {
    earn_start: {
      type: Date,
      default: Date.now
    },
    earn_end: {
      type: Date,
      default: Date.now
    },
    coupon_valid_days: {
      type: Number,
      default: 30
    }
  },
  issue_details: {
    issue_date: {
      type: Date,
      default: Date.now
    },
    issued_at: [{
      type: Schema.ObjectId,
      ref: 'Outlet',
      required: true,
    }],
    issued_to: {
      type: Schema.ObjectId,
      ref: 'Account',
      required: true
    },
    issued_by: {
      type: String,
      enum: ['twyst', 'merchant']
    },
    issue_source: {
      type: String
    }
  },
  used_details: {
    used_by: {
      type: Schema.ObjectId,
      ref: 'Account'
    },
    used_at: {
      type: Schema.ObjectId,
      ref: 'Outlet'
    },
    used_date: {
      type: Date
    },
    used_time: {
      type: Date
    }
  },
  reward: {},
  terms: {
    type: String
  },
  avail_hours: avail_hours.hours,

});

module.exports = mongoose.model('Coupon', CouponSchema);
