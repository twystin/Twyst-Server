var mongoose = require('mongoose');
var SmsLog = mongoose.model('SmsLog');
var _ = require('underscore');

module.exports.createLog = function (req, res) {
	
	var created_log = {};
	created_log = _.extend(created_log, req.body);
	var smslog = new SmsLog(created_log);
	
	console.log(smslog);
	console.log(req.body);
	smslog.save(function(err) {
		if (err) {
			
		} else {
			
		}				
	});
}

module.exports.deliveryReport = function (req, res) {
	
	console.log("HERE HERE HERE HERE")
	console.log(req.query);
}