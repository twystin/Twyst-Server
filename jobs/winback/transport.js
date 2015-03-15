var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');
var Utils = require('../../common/utilities');
var transports = {
	'CONSOLE': processConsole,
	'EMAIL': processEmail,
	'PUSH': processPush,
	'SMS': processSms
};

module.exports.handleMessage = function (user, winback, voucher) {
	var transport = getUserTransport(user);
	if(transport.CONSOLE) {
		transports['CONSOLE'](user, winback, voucher);
	}
	if(transport.EMAIL) {
		transports['EMAIL'](user, winback, voucher);
	}
	if(transport.PUSH) {
		transports['PUSH'](user, winback, voucher);
	}
	if(transport.SMS) {
		transports['SMS'](user, winback, voucher);
	}
}

function processSms(user, winback, voucher) {
	var outlet_phone = (
		winback.outlets[0].contact.phones.mobile ?
		winback.outlets[0].contact.phones.mobile[0].num :
		winback.outlets[0].contact.phones.landline);
	var push_message = "We haven't seen you at "+ winback.outlets[0].basics.name +" in a while! We have something extra for you – "+ rewardify(winback) +" when you visit next. Voucher code "+ voucher.basics.code +" (valid till "+ Utils.formatDate(voucher.validity.end_date) +"). To claim, just show this to your server. See you soon! Call "+ outlet_phone +" to reserve/order.";
	if (!user.blacklisted) {
		saveReminder(user.phone, push_message, winback.validity.send_voucher_at);
	}
}

function processConsole() {

}

function processPush() {

}

function processEmail() {

}

function saveReminder(phone, message, send_voucher_at) {
	var notif = getNotifObject(phone, message, send_voucher_at);

	notif.save(function (err) {
		if(err) {
			console.log(err);
		}
		else {
			console.log("Saved notif");
		}
	});
}

function getNotifObject(phone, message, send_voucher_at) {
	var obj = {};
	obj.phones = [];
	obj.phones.push(phone);
	obj.head = "WINBACK_VOUCHER_MESSAGE";
	obj.body = message;
	obj.message_type = "WINBACK_VOUCHER_MESSAGE";
	obj.status = 'DRAFT';
	obj.message_type = "SMS";
	obj.logged_at = Date.now();
	obj.scheduled_at = new Date(getSmsScheduleTime(send_voucher_at));

	return new Notif(obj);
}

function getSmsScheduleTime(send_voucher_at) {
	var today = new Date();
	var day = today.getDate(),
		month = today.getMonth(),
		year = today.getFullYear();
	return new Date(year, month, day, send_voucher_at);
}

function getUserTransport(user) {
	var user_transports = {
		'CONSOLE': false,
		'EMAIL': false,
		'PUSH': false,
		'SMS': true
	};
	return user_transports;
}

function rewardify(input) {
    if (input.reward.custom && input.reward.custom.text) {
        return input.reward.custom.text;
    } else if (input.reward.flat && (input.reward.flat.off || input.reward.flat.spend)) {
        if(input.reward.flat.off && input.reward.flat.spend) {
            return "Rs. " + ifEmpty(input.reward.flat.off) + " off on a min spend of Rs." + ifEmpty(input.reward.flat.spend);
        }
        if(input.reward.flat.off) {
            return "Rs. " + ifEmpty(input.reward.flat.off) + " off on your bill";
        }
    } else if (input.reward.free && (input.reward.free.title || input.reward.free._with)) {
        if(input.reward.free.title && input.reward.free._with) {
            return "A free " + ifEmpty(input.reward.free.title) + " with " + ifEmpty(input.reward.free._with);
        }
        if(input.reward.free.title) {
            return "A free " + ifEmpty(input.reward.free.title);
        }
    } else if (input.reward.buy_one_get_one && input.reward.buy_one_get_one.title) {
        return "Buy one get one " + ifEmpty(input.reward.buy_one_get_one.title);
    } else if (input.reward.reduced && (input.reward.reduced.what || input.reward.reduced.worth || input.reward.reduced.for_what)) {
        if(input.reward.reduced.what && input.reward.reduced.worth) {
           return ifEmpty(input.reward.reduced.what) + " worth Rs. " + ifEmpty(input.reward.reduced.worth) + " for Rs. " + ifEmpty(input.reward.reduced.for_what);
        }
    } else if (input.reward.happyhours && input.reward.happyhours.extension) {
        return "Extended happy hours by " + ifEmpty(input.reward.happyhours.extension);
    } else if (input.reward.discount) {
        if (input.reward.discount.max) {
            return ifEmpty(input.reward.discount.percentage) + " off, subject to a max discount of Rs." + ifEmpty(input.reward.discount.max);
        } else {
            return ifEmpty(input.reward.discount.percentage) + " off on your bill";
        }
    } else {
        return ifEmpty(input.basics.description);
    }

    function ifEmpty(input) {
        if(input) {
            return input;
        }
        return '';
    }
}
