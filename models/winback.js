'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    avail_hours = require("../common/operatingHours");

var WinbackSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    validity: {
        earn_start: {type: Date, default: Date.now},
        earn_end: {type: Date, default: Date.now},
        voucher_valid_days: {type: Number, default: 30},
        send_voucher_at: {type: Number}
    },
    min_historical_checkins: {type: Number},
    date_since_last_visit: {type: Date},
    messages: { 
        sms: {type: String},
        push: {type: String},
        email: {type: String}
    },
    reward: {
        discount: {
            max: String,
            percentage: String
        },
        flat: {
            off: String,
            spend: String
        },
        free: {
            title: String,
            _with: String,
            free_eligibility_type: String,
            free_eligibility_detail: String
        },
        buy_one_get_one: {
            title: String
        },
        reduced: {
            what: String,
            worth: String,
            for_what: String
        },
        happyhours: {
            extension: String
        },
        custom: {
            text: String
        }
    },
    terms: {type: String},
    avail_hours: avail_hours.hours,
    last_run_date: {type: Date},
    accounts: [{type: Schema.ObjectId, ref: 'Account'}],
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
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