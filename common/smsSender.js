var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";
var smsMessageSentLogs = require('../models/smsMessageSentLogs');
var http = require('http');
http.post = require('http-post');
var mongoose = require('mongoose');
var SmsSentLog = mongoose.model('SmsSentLog');
var Notif = mongoose.model('Notif');
var Account = mongoose.model('Account');
var UnsubCheck = mongoose.model('Unsbs');
var Outlet = mongoose.model('Outlet');
var outletHandles = require('../outlethandles');
var _ = require('underscore');

module.exports.sendSms = function (phone, push_message, type, from, outlet) {
	push_message = push_message.replace(/(\n)+/g, '');
	var message = push_message.replace(/&/g,'%26');
	message = message.replace(/% /g,'%25 ');

	console.log(message);
	console.log("------------------------");
	if(type === 'OTP_MESSAGE'
		|| type === 'UNSBS_MESSAGE') {
		send();
	}
	else {
		isBlackListedUser(phone, function (err, isBlackListed) {
			if(err || isBlackListed) {
				console.log("Blacklisted user.");
			}
			else {
				isUnsubscribedUser(phone, outlet, function(isUnsubscribed) {
					if(isUnsubscribed) {
						console.log('You have unsubscribed for this outlet');
						return 'User is unsbuscribed for message';           
	       				
					}
					else {
						checkType();
					}
				})
				
			}
		});
	}

	function isBlackListedUser(phone, cb) {
		Account.findOne({
			phone: phone,
			blacklisted: true
		}, function (err, user) {
			cb(err, user ? true : false);
		})
	}

	function isUnsubscribedUser (phone, outlet,  callback) {
		UnsubCheck.find({phone: phone}, function(err, unsubUser) {
			if(err) console.log(err);
			if(unsubUser[0]) {				
				var found = _.find(unsubUser[0].sms.outlets,  function(foundOutlet){ 
					if(outlet && foundOutlet) {
						return outlet.toString() === foundOutlet.toString();		
					}
					else {
						return false;
					}
					
				});

				if(unsubUser[0].sms.all || found) {
					callback(true);
				}
				else {
					callback(false);
				}	
			}
			else {
				callback(false);	
			}
			
		})

	}

	function checkType() {
		var time = null;
		time = Date.now();
		if(type === 'VOUCHER_MESSAGE') {
			time = time + 3 * 60 * 60 * 1000;
		}
		if(isAccurateTime(time)) {
			if(type !== 'VOUCHER_MESSAGE') {
				send();
			}
			else {
				schedule(phone, message, time);
			}
		}
		else {
			var schedule_time = getScheduleTime(time);
			schedule(phone, message, schedule_time);
		}
		
	}

	function getScheduleTime(time) {
		var hours = new Date(time).getHours();
		var year = new Date(time).getFullYear();
		var month = new Date(time).getMonth();
		var date = new Date(time).getDate();
		var hours = new Date(time).getHours();
		var minutes = new Date(time).getMinutes();
		if(hours > 16) {
			return new Date(year, month, date).getTime() + 30 * 60 * 60 * 1000;
		}
		else {
			hours = 5;
			minutes = 30;
			return new Date(year, month, date, hours, minutes);
		}
	}

	function isAccurateTime (time) {
		var smsOffStart = null, smsOffEnd = null; hours = null;
		var flag = Outlet.findOne({'_id': outlet}, function(err, currOutlet) {
			if(err) console.log(err)
			if(currOutlet) {
				smsOffStart = currOutlet.sms_off.time.start/60;
				smsOffEnd = currOutlet.sms_off.time.end/60;
				hours = new Date(time).getHours();
				console.log(hours + "  " +  new Date(time))	
			}
			
			if(hours > smsOffStart || hours < smsOffEnd) {
				return false;
			}
			return true;
		})
		return flag;
	}

	function schedule(phone, message, time) {
		var obj = {};
		obj.phones = [];
		obj.phones.push(phone);
		obj.head = type;
		obj.body = message;
		obj.status = 'DRAFT';
		obj.message_type = "SMS";
		obj.logged_at = Date.now();
		obj.scheduled_at = new Date(time);
		var notif = new Notif(obj);

		notif.save(function (err) {
			if(err) {
				console.log(err);
			}
			else {
				console.log("Saved notif");
			}
		});
	}

	function send() {
		from = from || 'TWYSTR';
		var send_sms_url = sms_push_url + phone + "&from="+ from +"&udh=0&text=" + message;
		http.get(send_sms_url, function(res){
			console.log(res.statusCode);
			var body = '';
			res.on('data', function(chunk) {
	            // append chunk to your data
	            body += chunk;
	        });

	        res.on('end', function() {
	        	saveSentSms(phone, message, body);
	            console.log(body);
	        });

	        res.on('error', function(e) {
	        	saveSentSms(phone, message, e);
	            console.log("Error message: " + e.message)
	        });
		});
	}
}

function saveSentSms (phone, message, status) {

	var sms_log = {};
	sms_log.phone = phone;
	sms_log.message = message;
	sms_log.status = status;

	var sms_log = new SmsSentLog(sms_log);

	sms_log.save(function (err) {
		if(err) {
			console.log(err);
		}
	});
}

