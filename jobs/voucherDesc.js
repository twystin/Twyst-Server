var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('../config/config_models')();
var Voucher = mongoose.model('Voucher');
mongoose.connect('mongodb://staging.twyst.in/twyst');
var count = 0;
Voucher.find({

}).populate('issue_details.issued_for').exec(function (err, vouchers) {
	vouchers.forEach(function (v) {
		if(v.issue_details.issued_for) {
			v.basics.description = v.issue_details.issued_for.basics.title;
			v.save(function (err, v) {
				console.log(err || v.basics.description);
				console.log(++count);
			})
		}
	})
})