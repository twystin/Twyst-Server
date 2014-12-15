'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Outlet = mongoose.model('Outlet');
var Offer = mongoose.model('Offer');

var BirthAnnivProgramSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true},
    event_type: [{type: String, enum: ['birth', 'anniv']}],
    created_at : {type: Date, default: Date.now},
    modified_at: {type: Date, default: Date.now},
    checkins: [{
        from: type: Number, default: '';
        to: type: Number, default: '',
        offer: [{type: Schema.ObjectId, ref: 'Offer'}]
    }]
    status: {type: String, enum: ['active', 'archived', 'draft'], default: 'draft'},
    message: {
        sms: {type: String},
        push: {type: String},
        email: {type: String}
    },
    num_day_before: {type: Number, default: 7},
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}]
});

module.exports = mongoose.model('BirthAnnivProgram', BirthAnnivProgramSchema);