var mongoose = require('mongoose');
mongoose.connect('localhost/twyst')
require('../config/config_models')();

var Account = mongoose.model('Account');
var Unsbs = mongoose.model('Unsbs');
var Outlet = mongoose.model('Outlet');
var smsSender = require('../common/smsSender');

blacklister('ALL', 8860377473,'sms', 'promotional');
function blacklister (code, phone, type, subtype){

//module.exports.blacklister = function (code, phone){
	if (!code){
		console.log("Invalid Code");
	}
	else {
		Unsbs.findOne({
			'phone' : phone
		}, function (err, unsbs){
			if (!unsbs){
				console.log(phone);
				getAccount(function (data){
					changeStatus(code, data, type, subtype);
				});
			}
			else if (unsbs && err){
				console.log(err);
			}
			else {
				changeStatus(code, unsbs, type, subtype);
			}
		})
	}

	function getAccount(cb){
		Account.findOne({
			'phone' : phone
		},function(err, account){
			if (!account){
				console.log("account does not exist");
			}
			else if (err && account){
				console.log(err);
			}
			else {
				var unsbsObject = new Unsbs();
				unsbsObject.user_id = account._id;
				unsbsObject.phone = phone;
				cb(unsbsObject);
			}
		});
	}
}

function changeStatus(code, unsbsObject, type, subtype){
	if (code === 'ALL'){
		unsbsObject[type][subtype].all = true;
		unsbsObject.save(function (err){
			var message = "You have unsubscribed from all the outlets at Twyst.";
			smsSender.sendSms(unsbsObject.phone, message, 'UNSUB_MESSAGE');
		});
	}
	else {
		Outlet.findOne({
			'shortUrl' : code
		}, function (err, outlet){
			unsbsObject[type][subtype].outlets.push(outlet._id);
			unsbsObject.save(function (err){
				var message = "You have unsubscribed from " + outlet.basics.slug +" outlet at Twyst.";
				smsSender.sendSms(unsbsObject.phone, message, 'UNSUB_MESSAGE');	
			});
		})		
	}
}