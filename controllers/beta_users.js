var mongoose = require('mongoose'),
	_ = require('underscore');
var BetaUser = mongoose.model('BetaUsers'),
	NewYear = mongoose.model('NewYear');
var Mailer = require('./mailer/mailer');

module.exports.create = function(req, res) {

	var created_user = {};
	created_user = _.extend(created_user, req.body);
	var betaUser = new BetaUser(created_user);
	betaUser.save(function(err) {
		if (err) {
			res.send(400, {	
				'status': 'error',
				'message': 'Error saving user',
				'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	
				'status': 'success',
				'message': 'Saved user',
				'info': ''
			});
			initEmail(betaUser);
		}		
	});
};

function initEmail(user) {
	var obj = {
		to: 'jayram@twyst.in, ar@twyst.in, rc@twyst.in, mayankyadav@twyst.in, al@twyst.in',
		data: {
			user_name: user.name,
			user_email: user.email,
			user_phone: user.phone,
			message: user.message
		},
		type: 'CONTACTUS'
	};
	Mailer.sendEmail(obj);
}

module.exports.addNewYear = function(req, res) {

	var created_user = {};
	created_user = _.extend(created_user, req.body);
	var newYearUser = new NewYear(created_user);
	
	newYearUser.save(function (err) {
		if(err) {
			res.send(400, {	
				'status': 'error',
				'message': 'Error saving data',
				'info': err

			});
		}
		else {
			res.send(200, {	
				'status': 'success',
				'message': 'Successfully saved data',
				'info': null
			});
		}
	})
};