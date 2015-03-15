'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    avail_hours = require("../common/operatingHours");

var OfferSchema = new Schema({
    username: {type: String},
    basics: {
        title: {type: String, trim: true, required: true},
        slug: {type: String, trim: true, required: true, index: true},
        description: {type: String, default: '', trim: true},
        images: [{type: String}],
        created_at : {type: Date, default: Date.now},
        modified_at: {type: Date, default: Date.now}
    },
    qr_only: {type: Boolean, default: false},
    terms: {type: String},
    avail_hours: avail_hours.hours,
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
    user_eligibility: {
        criteria: {
            condition: {type: String, enum: ['on every', 'after', 'on only']},
            value: String
        }
    },
    reward_applicability: {
        time_of_day: [{type:String, enum: ['breakfast', 'brunch', 'lunch', 'dinner', 'happy hours', 'all day', 'evening']}],
        day_of_week: [{type: String, enum: ['weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday','all days']}]
    },
    checkin_applicability: {
        time_of_day: {
            start_time: {type: Date},
            end_time: {type: Date}
        },
        day_of_week: [{type: String, enum: ['weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']}]
    },
    tags: [{type: String, default: '', trim: true}]
});

function slugify(title) {
    return title.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

OfferSchema.pre("validate", function (next) {
    if (!this.basics.title) next();
    this.basics.slug = slugify(this.basics.title);
    next();
});

module.exports = mongoose.model('Offer', OfferSchema);