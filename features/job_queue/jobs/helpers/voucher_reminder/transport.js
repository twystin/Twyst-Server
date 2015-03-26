var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');
var Unsbs = mongoose.model('Unsbs');

module.exports.handleReminder = function (voucher) {
	var user = voucher.issue_details.issued_to,
		outlets = voucher.issue_details.issued_at;
	if(outlets) {
		filterUnsbs(user._id, outlets, function (err, info) {
			if(err) {
				console.log("Error getting unsbs");
			}
			else {
				if(info) {
					console.log("Unsbs user");
				}
				else {
					if (!user.blacklisted) {
						processSms(user.phone, voucher, outlets[0]);
					}
				}
			}
		});
	}
}

function filterUnsbs(user_id, outlets, cb) {
	Unsbs.findOne({
		user: user_id,
		$or: [
			{
				'sms.remind.outlets': outlets.map(function (o){return o._id})
			},
			{
				'sms.remind.all': true
			}
		]
	}, function (err, unsbs) {
		cb(err, unsbs);
	});
}

function processSms(phone, voucher, outlet) {
	if(outlet.voucher_in_app) {
		var push_message = 'Your Twyst Voucher for ' + voucher.basics.description +', (TnC apply) at '+ voucher.issue_details.issued_at[0].basics.name +' is pending. Voucher code '+ voucher.basics.code +' - Redeem Today!';
		push_message += ' Click http://twyst.in/' + outlet.shortUrl[0] + ' to see all rewards at ' + outlet.basics.name +'. To stop receiving this, sms STOP ' + outlet.shortUrl[0] +' to 9266801954.';
	}
	else {
		var push_message = "Your Twyst voucher at "+outlet.basics.name+" is pending. Redeem it on the Twyst app today! Get the app at http://twyst.in/app For help, write to support@twyst.in. To stop receiving this, sms STOP "+outlet.shortUrl[0]+" to 9266801954.";
	}
	saveReminder(phone, push_message);
}

function saveReminder(phone, message) {
	var notif = getNotifObject(phone, message);

	notif.save(function (err) {
		if(err) {
			console.log(err);
		}
		else {
			console.log("Saved notif");
		}
	});
}

function getNotifObject(phone, message) {
	var obj = {};
	obj.phones = [];
	obj.phones.push(phone);
	obj.head = "VOUCHER_REMINDER_MESSAGE";
	obj.body = message;
	obj.message_type = "VOUCHER_REMINDER";
	obj.status = 'DRAFT';
	obj.message_type = "SMS";
	obj.logged_at = Date.now();
	obj.scheduled_at = new Date(getSmsScheduleTime());

	return new Notif(obj);
}

function getSmsScheduleTime() {
	var today = new Date();
	var day = today.getDate(),
		month = today.getMonth(),
		year = today.getFullYear();
	return new Date(year, month, day, 11, 30);
}
