var mongoose = require('mongoose');
mongoose.connect('localhost/twyst')
require('../config/config_models')();

var Account = mongoose.model('Account');
var Unsbs = mongoose.model('Unsbs');
var Outlet = mongoose.model('Outlet');

blacklister('CCC', '9871303236','sms');
//function blacklister (code, phone, type){

module.exports.blacklister = function (code, phone){
	var unsbsObject = new Unsbs();
	if (!code){

	}
	else {
		console.log("here");
		Unsbs.findOne({
			'phone' : phone
		}, function (err, unsbs){
			if (!unsbs){
				console.log(phone);
				Account.findOne({
					'phone' : phone
				},function(err, account){
					console.log(err || account);
					unsbsObject.user_id = account._id;
					unsbsObject.phone = phone;
					changeStatus(code, unsbsObject, type, 0);
				});
			}
			else {
				changeStatus(code, unsbs, type, 1);
			}
		})
	}
}

function changeStatus(code, unsbsObject, type, flag){
	if (code === 'ALL'){
		unsbsObject[type].reminders.all = true;
		saveDoc(unsbsObject, flag);
	}
	else {
		Outlet.findOne({
			'shortUrl' : code
		}, function (err, outlet){
			unsbsObject[type].reminders.outlets.push(outlet._id);
			saveDoc(unsbsObject, flag);
		})		
	}
}

function saveDoc(unsbsObject, flag){
	if (flag === 1){
		console.log("I am here")
		unsbsObject.save(function(err){
			console.log(err || "document saved");
		});
	}
	else {
		unsbsObject = new Unsbs(unsbsObject);
		unsbsObject.save(function (err, unsbsObject, affected){
			console.log("affected 2");
			console.log("docuement saved 2");
		})
	}
}