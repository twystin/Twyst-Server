'use strict'; 
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VoucherSchema = new Schema({
    basics: {
        code: {type: String, trim: true, required: true, unqiue: true, index: true},
        description: {type: String, default: '', trim: true},
        type: {type: String, default: '', trim: true},
        applicability: {type: String, default: '', trim: true},
        status : {type: String, enum: ['active', 'user redeemed', 'merchant redeemed'], default: 'active'},
        created_at : {type: Date, default: Date.now},
        modified_at: {type: Date, default: Date.now}
    },
    validity:{
        start_date: {type: Date, default: Date.now},
        end_date: {type: Date, default: Date.now},
        number_of_days: {type: String, default: ''}
    },
    issue_details:{
        issue_date : {type: Date, default: Date.now},
        issue_time : {type: Date, default: Date.now},
        issued_at : [{type: Schema.ObjectId, ref: 'Outlet'}],
        issued_to : {type: Schema.ObjectId, ref: 'Account'},
        program: {type: Schema.ObjectId, ref: 'Program'},
        tier: {type: Schema.ObjectId, ref: 'Tier'},
        issued_for: {type: Schema.ObjectId, ref: 'Offer'}
    },
    used_details: {
        used_by: {type: Schema.ObjectId, ref: 'Account'},
        used_at: {type: Schema.ObjectId, ref: 'Outlet'},
        used_date: {type: Date},
        used_time: {type: Date}
    },
    checkin_details: {
        checkin_id: {type: Schema.ObjectId, ref: 'Checkin'},
        batch: {type: Boolean, default: false}
    },
    redemption_phone_number: {type: String, default: ''},
    free_text: String
});


module.exports = mongoose.model('Voucher', VoucherSchema);