var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');
var Utils = require('../../common/utilities');
var transports = {
	'CONSOLE': processConsole,
	'EMAIL': processEmail,
	'PUSH': processPush,
	'SMS': processSms
};

module.exports.handleMessage = function (user, special, voucher) {
	var transport = getUserTransport(user);
	if(transport.CONSOLE) {
		transports['CONSOLE'](user, special, voucher);
	}
	if(transport.EMAIL) {
		transports['EMAIL'](user, special, voucher);
	}
	if(transport.PUSH) {
		transports['PUSH'](user, special, voucher);
	}
	if(transport.SMS) {
		transports['SMS'](user, special, voucher);
	}
}

function processSms(user, special, voucher) {

	var outlet_phone = (
		special.outlets[0].contact.phones.mobile ?
		special.outlets[0].contact.phones.mobile[0].num :
		special.outlets[0].contact.phones.landline);

	console.log("VOUCHER " + JSON.stringify(voucher));
	console.log("WINBACK " + JSON.stringify(special));

	var push_message = "Birthday wishes from " + special.outlets[0].basics.name + "! We have a little something for you – " + rewardify(special) + " - when you visit next. Voucher code "+ voucher.basics.code +" (valid till "+ Utils.formatDate(voucher.validity.end_date) +"). To claim, just show this to your server. See you soon! Call "+ outlet_phone +" to reserve/order.";
	console.log(user);
	if (!user.blacklisted) {
		saveReminder(user.phone, push_message, special.validity.send_at.at_hours);
	} else {
		console.log("Blacklisted user");
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
    if (input.ranges[0].reward.custom && input.ranges[0].reward.custom.text) {
        return input.ranges[0].reward.custom.text;
    } else if (input.ranges[0].reward.flat && (input.ranges[0].reward.flat.off || input.ranges[0].reward.flat.spend)) {
        if(input.ranges[0].reward.flat.off && input.ranges[0].reward.flat.spend) {
            return "Rs. " + ifEmpty(input.ranges[0].reward.flat.off) + " off on a min spend of Rs." + ifEmpty(input.ranges[0].reward.flat.spend);
        }
        if(input.ranges[0].reward.flat.off) {
            return "Rs. " + ifEmpty(input.ranges[0].reward.flat.off) + " off on your bill";
        }
    } else if (input.ranges[0].reward.free && (input.ranges[0].reward.free.title || input.ranges[0].reward.free._with)) {
        if(input.ranges[0].reward.free.title && input.ranges[0].reward.free._with) {
            return "A free " + ifEmpty(input.ranges[0].reward.free.title) + " with " + ifEmpty(input.ranges[0].reward.free._with);
        }
        if(input.ranges[0].reward.free.title) {
            return "A free " + ifEmpty(input.ranges[0].reward.free.title);
        }
    } else if (input.ranges[0].reward.buy_one_get_one && input.ranges[0].reward.buy_one_get_one.title) {
        return "Buy one get one " + ifEmpty(input.ranges[0].reward.buy_one_get_one.title);
    } else if (input.ranges[0].reward.reduced && (input.ranges[0].reward.reduced.what || input.ranges[0].reward.reduced.worth || input.ranges[0].reward.reduced.for_what)) {
        if(input.ranges[0].reward.reduced.what && input.ranges[0].reward.reduced.worth) {
           return ifEmpty(input.ranges[0].reward.reduced.what) + " worth Rs. " + ifEmpty(input.ranges[0].reward.reduced.worth) + " for Rs. " + ifEmpty(input.ranges[0].reward.reduced.for_what);
        }
    } else if (input.ranges[0].reward.happyhours && input.ranges[0].reward.happyhours.extension) {
        return "Extended happy hours by " + ifEmpty(input.ranges[0].reward.happyhours.extension);
    } else if (input.ranges[0].reward.discount) {
        if (input.ranges[0].reward.discount.max) {
            return ifEmpty(input.ranges[0].reward.discount.percentage) + " off, subject to a max discount of Rs." + ifEmpty(input.ranges[0].reward.discount.max);
        } else {
            return ifEmpty(input.ranges[0].reward.discount.percentage) + " off on your bill";
        }
    } else {
        return ifEmpty(input.desc);
    }

    function ifEmpty(input) {
        if(input) {
            return input;
        }
        return '';
    }
}
