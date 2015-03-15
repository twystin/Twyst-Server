'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProgramSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    created_at : {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now},
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    validity: {
        earn_start: {type: Date, default: Date.now},
        earn_end: {type: Date, default: Date.now},
        burn_start: {type: Date, default: Date.now},
        burn_end: {type: Date, default: Date.now}
    },
    images: [{type: String}],
    accounts: [{type: Schema.ObjectId, ref: 'Account'}],
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}],
    tiers : [{type: Schema.ObjectId, ref: 'Tier'}],
    icon :{type:String}
});

function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

ProgramSchema.pre('validate', function (next) {
    if(!this.name) next();
    this.slug = slugify(this.name);
    next();
});
module.exports = mongoose.model('Program', ProgramSchema);