'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TierSchema = new Schema({
    basics: {
        username: {type: String},
        name: {type: String, trim: true, required: true},
        slug: {type: String, trim: true, required: true, index: true},
        start_value: {type: Number},
        end_value: {type: Number},
        created_at : {type: Date, default: Date.now},
        modified_at: {type: Date, default: Date.now}
    },
    offers: [{type: Schema.ObjectId, ref: 'Offer'}]
});

TierSchema.pre('validate', function (next) {
    if (!this.basics.name) next();
    this.basics.slug = slugify(this.basics.name);
    next();
});

function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

module.exports = mongoose.model('Tier', TierSchema);