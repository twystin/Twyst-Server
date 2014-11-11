var mongoose = require('mongoose');
var SmsLog = mongoose.model('SmsLog');
var Checkin = mongoose.model('Checkin');
var _ = require('underscore');
var async = require('async');

var sms_push_url = "http://myvaluefirst.com/smpp/sendsms?username=twysthttp&password=twystht6&to=";

var http = require('http');
http.post = require('http-post');
var SMS = require('../common/smsSender');

module.exports.getApp = function(req, res) {
	var phone = req.query.mobile_number;

	if(phone.length >= 10) {
		phone = phone.substring(phone.length-10,phone.length);
	}

	var sms_text = req.query.sms_text;
	var date_time = req.query.date_time;
	var operator = req.query.operator;
	var circle = req.query.circle;

	var merchant = '';
	
	var sms_text = sms_text.split(' ');
	var merchant = sms_text[1];

	res.send(200); // Success to ValueFirst
	
	assembleLog(phone, sms_text, date_time, operator, circle, merchant);

	sendAppDownloadSMS(phone, merchant);
}

function sendAppDownloadSMS(mobile, merchant) {
	var merchant = merchant || '';
	var message = "Thanks for your interest. Please click on http://twyst.in/metropark to sign up for the Metro Park Foodie Challenge on Twyst!";
	
	SMS.sendSms(mobile, message);
}

function assembleLog(phone, sms_text, date_time, operator, circle, merchant) {
	var created_log = {};

	created_log.phone = phone;
	created_log.sms_text = sms_text;
	created_log.operator = operator;
	created_log.circle = circle;
	created_log.merchant = merchant;
	created_log.action = "User sent sms for App download.";
	createLog(createLog);
}

function createLog (created_log) {
	
	var log = new SmsLog(created_log);
	
	log.save(function(err) {
		if (err) {
			
		} else {
			console.log("Message logged.");
		}				
	});
}

module.exports.getDownloads = function (req, res) {
	var outlet_id = req.query.outlet,
		start_date = req.query.start_date,
		end_date = req.query.end_date;
	Checkin.find({
		'outlet': outlet_id,
		'created_date': {
				$gte: new Date(start_date),
				$lte: new Date(end_date)
		},
		'checkin_type': 'QR'
	}, function (err, checkins) {		
		if(err) {
			res.send(400, {	
				'status': 'error',
				'message': 'Error getting count',
				'info': err
			});
		}
		else {
			checkins = _.uniq(checkins, function (c) {
				return c.phone;
			})
			getDownloaders(checkins, function (err, count) {
				if(err) {
					res.send(400, {	
						'status': 'error',
						'message': 'Error getting count',
						'info': err
					});
				}
				else {
					res.send(200, {	
						'status': 'error',
						'message': 'Got count successfully',
						'info': count
					});
				}
			})
		}
	})
}

function getDownloaders(checkins, cb) {
	var distinct_checkins = checkins.length;
	async.each(checkins, function (ch, callback) {
        Checkin.findOne({
			phone: ch.phone,
			created_date: {
				$lt: new Date(ch.created_date)
			}
		}, function (err, checkin) {
			if(checkin) {
				--distinct_checkins;
			}
			callback(err, null);
		})
    }, function (err) {
        cb(err, distinct_checkins);
    })
}