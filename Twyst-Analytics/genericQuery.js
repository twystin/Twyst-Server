var mongoose = require('mongoose');
require('../config/config_models')();

mongoose.connect('mongodb://localhost/twyst');

function genericQuery(modelName, queryType, query, callback) {
	var Model = mongoose.model(modelName);
	Model[queryType](query, function (err, result) {
		callback(err, result);
	});
}

genericQuery('Checkin', 'count', {}, function (err, count) {
	if(err) {
		console.log(err);
	}
	else {
		console.log("Total checkin count = " + count);
	}
});