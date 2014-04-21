'use strict';

var settings = require('../../config/settings');

var constants = {};
constants.USER = {};
constants.SMS_PROVIDER  = {};
constants.VERSION = {};

constants.SMS_PROVIDER.number = '+919266801954';
constants.SMS_PROVIDER.prefix = 'CHK';

constants.VERSION = settings.values.version;

module.exports.getConst = function (req, res) {

	if(req.isAuthenticated()) {
		constants.USER = req.user;
	}
	else {
		constants.USER = null;
	}

	res.send(200, {
		'status': 'success',
		'message': 'Got constants successfully',
		'info': constants
	});
}