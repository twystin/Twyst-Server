// Load up the models required.
var mongoose = require('mongoose');
var Voucher = mongoose.model('Voucher');
var	Deal = mongoose.model('Deal');
var Account = mongoose.model('Account');
var keygen = require("keygenerator");
var _ = require('underscore');

module.exports.useDeal = function(req, res) {
	var deal = req.body;
	var user = req.user;
	console.log('deal id ' + deal)
	Deal.find({'_id': deal._id},  function(err, gotDeal) {
		if(err) console.log('error in getting deal ' + err);
		console.log('gotDeal' +gotDeal);

		saveVoucher(gotDeal, user, function(err, callback) {
			if(err) {
				console.log(err)
				res.send(400, {
					'status': 'error',
					'message': 'There is somthing wrong',
					'info': err
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Voucher successfully generated for deal',
					'info': Voucher
				});
			}

		})
	})

}

// Get the voucher object and save it!
function saveVoucher(deal, user, cb) {
	var voucher = getVoucherObject(deal, user);
	voucher = new Voucher(voucher);

	voucher.save(function (err) {
		if(err) {
			cb(err, voucher);
		}
		else {
			cb(null, voucher);
		}

	})


}

// Generate the voucher object for the deal.
function getVoucherObject(deal, user) {
	var voucher = {
		basics: {
			code: keygen._({
				forceUppercase: true,
				length: 6,
				exclude:['O', '0', 'L', '1']
			}),
			description: deal.detail,
			created_at: new Date(),
			modified_at: new Date(),
			status: 'active',
			type: 'DEAL'
		},
		terms: deal.tc,
		validity: {
			start_date: new Date(),
			end_date: Date.now() + 7 * 86400000
		},
		issue_details: {
			issue_date: new Date(),
			issued_at: deal.outlets,
			issued_to: user && user._id || null
		}
	}
	return voucher;
}
