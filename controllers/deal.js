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
	saveVoucher(deal, user, function(err, callback) {
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
				'info': callback
			});
		}

	})
	

}

// Get the voucher object and save it!
function saveVoucher(deal, user, cb) {
	var voucher = getVoucherObject(deal, user);
	voucher = new Voucher(voucher);

	voucher.save(function (err) {
		if(err) {
			console.log('err' + err)
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
			end_date: Date.now() + 7 * 86400000,
			number_of_days: 7
		},
		issue_details: {
			issue_date: new Date(),
			issued_at: deal.outlets,
			issued_to: user && user._id || null
		},
		applicable_hours: deal.available_at
	}
	return voucher;
}


module.exports.updateDeal = function(req, res) {
	var created_deal = {};
    created_deal = _.extend(created_deal, req.body);
    delete created_deal.__v;
    var deal = new Deal(created_deal);
    updateDeal(deal, function (err) {
        if(err) {
        	console.log(err)
            res.send(400, { 'status': 'error',
                        'message': 'Error saving deal.',
                        'info': err
            });
        }
        else {
            res.send(200, { 'status': 'success',
                        'message': 'Saved deal successfully.',
                        'info': ''
            });
        }
    })
}

function updateDeal(deal, cb) {
    var id = deal._id;
    delete deal._id;
    if(deal.tc && deal.info) {
    	Deal.findOneAndUpdate({
	        _id: id
	    }, {
	        $set: deal
	    }, {
	        upsert: true
	    }, function (err, deal) {
	        cb(err, deal);
	    })	
    }
    else {
    	callback(err, null);
    }
    
}