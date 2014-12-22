var mongoose = require('mongoose');
mongoose.connect('mongodb://50.112.253.131/twyst');
require('../config/config_models')();
var Populator = require("../controllers/reward_populate");
var Program = mongoose.model('Program');

Program.find({

}, function (err, programs) {
	if(err) {
		console.log(err);
	}
	else {
		populate(programs);
	}
});

function populate(programs) {
	programs.forEach(function (p) {
		Populator.createRewardTable(p._id, function (err, data) {
			console.log(err || data);
		});
	})
}