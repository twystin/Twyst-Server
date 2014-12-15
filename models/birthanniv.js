'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Outlet = mongoose.model('Outlet');
var avail_hours = require("../common/operatingHours");

var BirthAnnivSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    event_type: [{type: String, enum: ['birth', 'anniv']}],
    created_at : {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now},
    checkin_tier: [{
        from: {type: Number, default: ''},
        to: {type: Number, default: ''},
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
        terms: {type: String}
    }],
    validity: {
        earn_start: {type: Date, default: Date.now},
        earn_end: {type: Date, default: Date.now},
        valid_days: {
            before: {type: Number},
            after: {type: Number}
        },
        send_at: {
            days_before: {type: Number},
            at_hours: {type: Number}
        }
    },
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    message: {
        sms: {type: String},
        push: {type: String},
        email: {type: String}
    },
    avail_hours: avail_hours.hours,
    last_run_date: {type: Date},
    accounts: [{type: Schema.ObjectId, ref: 'Account'}],
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    images: [{type: String}],
    icon :{type:String}
});

function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

BirthAnnivSchema.pre('validate', function (next) {
    if(!this.name) next();
    this.slug = slugify(this.name);
    next();
});

module.exports = mongoose.model('BirthAnniv', BirthAnnivSchema);