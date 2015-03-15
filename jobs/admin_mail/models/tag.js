'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema ({
    name: {type: String, trim: true, required: true},
    slug: {type: String, trim: true, required: true, unique: true},
    offers: [{type: Schema.ObjectId, ref: 'Offer'}],
    outlets: [{type: Schema.ObjectId, ref: 'Outlet'}]
});

function slugify(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/\W/g, '');
}

TagSchema.pre('validate', function (next) {
    if(!this.name) next();
    this.slug = slugify(this.name);
    next();
});
module.exports = mongoose.model('Tag', TagSchema);