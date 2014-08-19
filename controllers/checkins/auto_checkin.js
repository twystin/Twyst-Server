var CheckinCtrl = require('./panel/main');
var SMS = require('../../common/smsSender');

module.exports.autoCheckin = function (obj) {
	CheckinCtrl.initCheckin(obj, function (success_object) {
		if(success_object.sms) {
			console.log("User automaticaly checked in: " + obj.phone);
			SMS.sendSms(obj.phone, success_object.sms);
		}
	})
}