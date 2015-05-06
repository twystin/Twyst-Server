'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var business_hours = require("../common/operatingHours")

var DealSchema = new Schema ({
    detail: {type: String, trim: true, required: true},
    info: {type: String},
    tc: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    created_at : {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now},
    end_date: {type: Date, default: Date.now},
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    avaiable_at: {
      '1': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '2': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '3': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '4': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '5': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '6': {s:{h:Number,m:Number}, e:{h:Number, m:Number}},
      '7': {s:{h:Number,m:Number}, e:{h:Number, m:Number}}
    },
    generate_coupon: {type: Boolean},
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}]
});

function slugify(detail) {
    return detail.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

DealSchema.pre('validate', function (next) {
    if(!this.detail) next();
    this.slug = slugify(this.detail);
    next();
});
module.exports = mongoose.model('Deal', DealSchema);
