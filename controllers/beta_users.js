var mongoose = require('mongoose');
var BetaUser = mongoose.model('BetaUsers');

var _ = require('underscore');

module.exports.create = function(req,res) {

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

			res.send(200, {	'status': 'success',

						'message': 'Saved user',

						'info': ''

			});

		}				

	})

};