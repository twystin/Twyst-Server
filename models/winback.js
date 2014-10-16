'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WinbackSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    validity: {
        earn_start: {type: Date, default: Date.now},
        earn_end: {type: Date, default: Date.now},
        voucher_valid_days: {type: Number, default: 30} 
    },
    min_historical_checkins: {type: Number},
    days_since_last_visit: {type: Number},
    messages: {
        sms: {type: String},
        push: {type: String},
        email: {type: String}
    },
    first_run: {type: Boolean, default: false},
    accounts: [{type: Schema.ObjectId, ref: 'Account'}],
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    offers: [{type: Schema.ObjectId, ref: 'Offer'}],
    images: [{type: String}],
    icon :{type:String},
    created_at : {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now}
});

function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

WinbackSchema.pre('validate', function (next) {
    if(!this.name) next();
    this.slug = slugify(this.name);
    next();
});
module.exports = mongoose.model('Winback', WinbackSchema);