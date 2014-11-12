'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Account = mongoose.model('Account'),
    business_hours = require("../common/operatingHours")

var OutletSchema = new Schema({
    username: {type: String},
    publicUrl: [{type: String}],
    shortUrl: [{type: String}],
    basics : {
        name: {type: String, trim: true, required: true},
        slug: {type: String, trim: true, required: true, index: true},
        relationship: {type: String, enum: ['Owner', 'General Manager','Floor Manager']},
        merchant_name: {type: String, default: ''},
        contact_person_name: {type: String, default: ''},
        size: {type: String, default: '', trim: true}, // size of the establishament
        is_a: {type: String, enum: ['restaurant','biryani','chinese','conntinental','north_indian','fast_food','burgers','pizza','wraps','pub','beer','bakery','cake','cafe','bistro','takeaway','other']},
        icon: {type: String, enum: ['restaurant','biryani','chinese','conntinental','north_indian','fast_food','burgers','pizza','wraps','pub','beer','bakery','cake','cafe','bistro','takeaway','other']},
        franchise: {type: Boolean},
        images: [{type: String}],
        created_at : {type: Date, default: Date.now},
        modified_at: {type: Date, default: Date.now}
    },
    contact: {
        location: {
            coords: {
                longitude: { type: Number },
                latitude: { type: Number }
            },
            address: {type: String, default: '', unique: true, trim: true},
            map_url: {type: String, default: '', trim: true},
            landmarks: [{type: String, default: '', trim: true}],
            locality_1: [{type: String, default: '', trim: true}],
            locality_2: [{type: String, default: '', trim: true}],
            city : {type: String, default: '', trim: true},
            pin : {type: String, default: '', trim: true}
        },
        phones: {
            mobile: [{num: {type:String, default: '', trim: true}}],
            reg_mobile: [{num: {type:String, default: '', trim: true}}],
            landline: {type:String, default: '', trim: true},
            type: {type: String, enum: ['landline', 'mobile', 'other']},
            number: {type: String, default: '', trim: true}
        },
        emails: {
            person: {type: String, default: '', trim: true},
            email: {type: String, default: '', trim: true},
            type: {type: String, enum: ['personal', 'work']}
        }
    },
    links: {
        website_url: {type: String, default: ''},
        facebook_url: {type: String, default: ''},
        twitter_url: {type: String, default: ''},
        youtube_url: {type: String, default: ''},
        zomato_url: {type: String, default: ''},
        foodpanda_url: {type: String, default: ''},
        other_urls: [{
            link_name: {type: String, default: ''},
            link_url: {type: String, default: ''}
        }]
    },
    business_hours: business_hours.hours,
    attributes: {
        home_delivery: {type: Boolean},
        dine_in: {type: Boolean},
        veg: {type: Boolean},
        alcohol: {type: Boolean},
        outdoor: {type: Boolean},
        foodcourt: {type: Boolean},
        smoking: {type: Boolean},
        chain: {type: Boolean},
        air_conditioning: {type: String, enum: ["Available", "Not Available", "Partial"]},
        parking: {type: String, enum: ["Available", "Not Available", "Valet"]},
        reservation: {type: String, enum: ["Recommended", "Not Required"]},
        wifi: {type: String, enum: ["Not Available", "Free", "Paid"]},
        cost_for_two: {
            min: Number,
            max: Number
        },
        timings: {type: String, default: '', trim: true},
        cuisines: [String],
        payment_options: [{type: String, enum: ['cash', 'visa', 'master', 'amex', 'sodexho']}],
        tags: [{type: String, default: '', trim: true}]
    },
    photos: {
        logo: {type: String, trim: ''},
        logo_gray: {type: String, trim: ''},
        background: {type: String, trim: ''},
        others:[{
            title: {type: String, default: '', trim: ''},
            image: {type: String, default: '', trim: ''},
            approved: {type: Boolean, default: false}
        }]
    },
    outlet_meta: {
        accounts: [{type: Schema.ObjectId, ref: 'Account'}],
        status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
        links: [{type: Schema.ObjectId, ref: 'Outlet'}]
    },
    twyst_meta: {
        rating: {
            count: {type: Number},
            value: {type: Number, min: 0, max: 5}
        },
        reviews: [
            {
                review: {type: String, default: ''}
            }
        ],
        recommend_list: [{type: Schema.ObjectId, ref: 'Outlet'}]
    },
    sms_off: {
        value: {type: Boolean},
        time: {
            start: {type: Number, default: 23},
            end: {type: Number, default: 9}
        }
    }
});

OutletSchema.pre('validate', function (next) {
    if (!this.basics.name) next();
    this.basics.slug = slugify(this.basics.name);
    next();
});

function slugify(created_outlet) {
    return created_outlet.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

module.exports = mongoose.model('Outlet', OutletSchema);