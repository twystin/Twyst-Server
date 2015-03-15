var mongoose = require('mongoose');
var Program = mongoose.model('Program');

module.exports.schedule = function (message, cb) {
	console.log("shudhuh")
	cb(null, null)
	// var message = new Message(message);
	// message.save(function (err, message) {
	// 	cb(err, message);
	// })
}