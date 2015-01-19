var mongoose = require('mongoose'),
	_ = require('underscore');
var BetaMerchant = mongoose.model('BetaMerchants');
var Mailer = require('./mailer/mailer');

module.exports.create = function(req,res) {
	var created_merchant = {};
	created_merchant = _.extend(created_merchant, req.body);
	var betaMerchant = new BetaMerchant(created_merchant);
	betaMerchant.save(function(err) {
		if (err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error saving merchant',
				'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	
				'status': 'success',
				'message': 'Saved merchant',
				'info': ''
			});
			initEmail(betaMerchant);
		}				
	})
};

function initEmail(user) {
	var obj = {
		to: 'jayram@twyst.in, al@twyst.in, ar@twyst.in, rc@twyst.in, mayankyadav@twyst.in',
		data: {
			outlet_name: user.establishment_name,
			user_name: user.person_name,
			user_email: user.email,
			user_phone: user.phone_number,
			city: user.city
		},
		type: 'CONTACTUS_MERCHANT'
	};
	Mailer.sendEmail(obj);
}