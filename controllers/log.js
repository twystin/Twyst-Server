'use strict';
var mongoose = require('mongoose');
var Log = mongoose.model('Log');
var _ = require('underscore');

module.exports.createLog = function (req, res) {
	var created_log = {};
	created_log = _.extend(created_log, req.body);
	var log = new Log(created_log);
	log.save(function(err) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error saving log',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Saved log',
						'info': ''
			});
		}
	});
};