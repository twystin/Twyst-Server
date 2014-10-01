var CheckinCtrl = require('./panel/main');
var SMS = require('../../common/smsSender');

module.exports.autoCheckin = function (obj) {
	CheckinCtrl.initCheckin(obj, function (success_object) {
		console.log("User automaticaly checked in: " + obj.phone);
		if(success_object.sms && success_object.sms.checkin) {
			SMS.sendSms(obj.phone, success_object.sms.checkin, 'CHECKIN_MESSAGE');
		}
		if(success_object.sms && success_object.sms.reward) {
			SMS.sendSms(obj.phone, success_object.sms.reward, 'VOUCHER_MESSAGE');
		}
	})
}