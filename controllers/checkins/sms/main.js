var mongoose = require('mongoose');
var Qr = mongoose.model('Qr');
var CheckinCtrl = require('../panel/main');
var SMS = require('../../../common/smsSender');

module.exports.smsCheckin = function (checkin_obj) {
	getQr(checkin_obj.checkin_code, function (qr, push_message) {
		if(qr) {
			if(isQrValid(qr)) {
				checkin_obj.outlet = qr.outlet_id;
				checkin_obj.location = "DINE_IN";
				CheckinCtrl.initCheckin(checkin_obj, function (success_object) {
					if(success_object.sms && success_object.sms.checkin) {
						SMS.sendSms(checkin_obj.phone, success_object.sms.checkin, 'CHECKIN_MESSAGE');
					}
					if(success_object.sms && success_object.sms.reward) {
						SMS.sendSms(checkin_obj.phone, success_object.sms.reward, 'VOUCHER_MESSAGE');
					}
					if(!success_object.sms) {
						var push_message = success_object.res.message.message;
						push_message = push_message.replace(/User/g, 'You');
						push_message = push_message.replace(/has/g, 'have');
						push_message = push_message.replace(/his/g, 'your');
						SMS.sendSms(checkin_obj.phone, push_message, 'CHECKIN_ERROR_MESSAGE');
					}
				});
			}
			else {
				var push_message = 'Sorry, check-in unsuccessful. This code has expired. Please try again with a valid code.';
				SMS.sendSms(checkin_obj.phone, push_message, 'SMS_CODE_EXPIRED_MESSAGE');
			}
		}
		else {
			SMS.sendSms(checkin_obj.phone, push_message, 'SMS_CODE_ERROR_MESSAGE');
		}
	});
}

function isQrValid(qr) {
	if(qr.times_used < qr.max_use_limit) {
		if(qr.validity.start && qr.validity.end) {
			if(new Date(qr.validity.start) < new Date() 
				&& new Date(qr.validity.end) > new Date()) {
				return true;
			}
			else {
				return false;			
			}
		}
		else {
			return false;	
		}
	}
	else {
		return false;	
	}
}

function getQr(code, cb) {
	Qr.findOne({
		code: code
	}, function (err, qr) {
		if(err) {
			var push_message = 'Sorry, check-in unsuccessful. This code is invalid. Please try again with a valid code.';
			cb(null, push_message);
		}
		else {
			if(qr) {
				cb(qr, null);
			}
			else {
				var push_message = 'Sorry, check-in unsuccessful. This code is invalid. Please try again with a valid code.';
				cb(null, push_message);
			}
		}
	});
}