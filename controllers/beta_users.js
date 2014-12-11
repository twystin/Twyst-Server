var mongoose = require('mongoose');
var BetaUser = mongoose.model('BetaUsers'),
	NewYear = mongoose.model('NewYear');
var MailSender = require('../common/sendMail');

var _ = require('underscore');

module.exports.create = function(req, res) {

	var created_user = {};

	created_user = _.extend(created_user, req.body);
	var betaUser = new BetaUser(created_user);
	betaUser.save(function(err) {

		if (err) {

			res.send(400, {	'status': 'error',

						'message': 'Error saving user',

						'info': JSON.stringify(err)

			});

		} else {
			var to ='<jayram.chandan@gmail.com>,<mayankyadav@twyst.in>,<rc@twyst.in>'
			MailSender.sendEmail(to, created_user)

			res.send(200, {	'status': 'success',

						'message': 'Saved user',

						'info': ''

			});

		}				

	})

};

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