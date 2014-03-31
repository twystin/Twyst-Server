var mongoose = require('mongoose');
var BetaMerchant = mongoose.model('BetaMerchants');
var _ = require('underscore');

module.exports.create = function(req,res) {
	var created_merchant = {};
	created_merchant = _.extend(created_merchant, req.body);

	var betaMerchant = new BetaMerchant(created_merchant);
	betaMerchant.save(function(err) {
		if (err) {
			res.send(400, {'status': 'error',
						'message': 'Error saving merchant',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Saved merchant',
						'info': ''
			});
		}				
	})
};