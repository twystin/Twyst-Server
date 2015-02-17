var Checkin_Main = require('./main'),
	Utils = require('../../../common/utilities'),
	SMS = require('../../../common/smsSender'),
	Helper = require('./helper');
var _ = require('underscore'),
	async = require('async');

module.exports.panelCheckin = function (req, res) {
	var _obj = {
		phone: req.body.phone,
		outlet: req.body.outlet,
		location: req.body.location,
		created_date: req.body.created_date
	};

	Checkin_Main.checkin(_obj, function (err, data) {
		if(err) {
			res.send(400,  {
				'status': 'error',
				'message': err.message,
				'info': err.ifo
			});
		}
		else {
			smsHandler(data.info);
			res.send(200, {
				'status': 'success',
				'message': data.message,
				'info': data.info
			})
		}
	});
};

module.exports.poscheckin = function(req, res){
	var rows = req.body.rows;
	if(!rows || !rows.length) {
		res.send(400, {
			'status': 'error',
			'message': 'Nothing to checkin',
			'info': null
		})
	}
	else { 
		rows = _.uniq(rows);
		async.each(rows, function (phone, callback) {
			var _obj = {
	            'phone': phone,
	            'outlet': req.body.outlet,
	            'location': 'HOME_DELIVERY',
	            'created_date': new Date(),
	            'checkin_type' : 'POS',
	            'checkin_code' : 'POS'
	        };
		    Checkin_Main.checkin(_obj, function (err, data) {
				if(err) {
					callback();
				}
				else {
					smsHandler(data.info);
					callback();
				}
			});
		}, function (err) {
			res.send(200, {
				'status': 'success',
				'message': 'Checked in successfully',
				'info': null
			})
		})
	}
};

module.exports.batchCheckin = function (req, res) {
	var message = req.body.message,
		sms_sender_id = req.body.sms_sender_id;
	var _obj = {
        'phone': req.body.phone,
        'outlet': req.body.outlet,
        'location': req.body.location,
        'created_date': new Date(),
        'checkin_type' : 'BATCH',
        'checkin_code' : 'BATCH'
    };
    Checkin_Main.checkin(_obj, function (err, data) {
		if(err) {
			res.send(400,  {
				'status': 'error',
				'message': err.message,
				'info': err.ifo
			});
		}
		else {
			batchSmsHandler(data.info, message, sms_sender_id);
			res.send(200, {
				'status': 'success',
				'message': _obj.phone + ' Checked in successfully',
				'info': null
			})
		}
	});
}

module.exports.autoCheckin = function (_obj, cb) {
	Checkin_Main.checkin(_obj, function (err, data) {
		if(err) {
			
		}
		else {
			smsHandler(data.info);
		}
	});
}

function batchSmsHandler(_obj, _message, sms_sender_id) {
	if(_obj.voucher) {
		_message = _message.replace(/xxxxxx/g, _obj.voucher.basics.code);
		SMS.sendSms(_obj.phone, _message, 'BATCH_CHECKIN_MESSAGE', sms_sender_id);
	}
}

function smsHandler(_obj) {
	Helper.getOutlet(_obj.outlet, function (err, outlet) {
		if(err) {
			console.log(err);
			// Do nothing
		}
		else {
			if(outlet) {
				checkinMessageSender(_obj, outlet);
				if(_obj.voucher) {
					voucherMessageSender(_obj, outlet);
				}
			}
			else {
				// Do nothing
				console.log("Outlet not found")
			}
		}
	})
}

function checkinMessageSender(_obj, outlet) {
	var _message = null;
	if(isVoucherInApp(outlet)) {
		if(_obj.count === 0) {
	        if(_obj.voucher) {
	            _message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +". Reward unlocked! Your voucher will be available on your Twyst app soon. Don't have the app? Get it now at http://twy.st/app";
	        }
	        else {
	            _message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
	        }
	    }
	    else {
	        if(_obj.voucher) {
	            _message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +". Reward unlocked! Your voucher will be available on your Twyst app soon. Don't have the app? Get it now at http://twy.st/app";
	        }
	        else {
	            _message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];   
	        }
	    }
	}
	else {
    	if(_obj.count === 0) {
			if(_obj.voucher) {
				_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. Reward unlocked - yay! You will soon receive your voucher code via SMS. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
			else {
				_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst!. Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
		}
		else {
			if(_obj.voucher) {
				_message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +'. Reward unlocked - yay! You will soon receive your voucher code via SMS. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
			else {
				_message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];	
			}
		}
	}
	if(outlet.checkin_message_append) {
		_message += ' ' + outlet.checkin_message_append;
	}
	SMS.sendSms(_obj.phone, _message, 'CHECKIN_MESSAGE');
}

function voucherMessageSender(_obj, outlet) {
	var _message;
	if(isVoucherInApp(outlet)) {
		_message = 'Your Twyst reward voucher at '+ outlet.basics.name +' is now available. View and redeem your reward on the Twyst app. Get it now at http://twy.st/app Need help? Give us a shout on support@twyst.in';
	}
	else {
		_message = 'Your Twyst voucher code at '+ outlet.basics.name +' is '+ _obj.voucher.basics.code +'. '+ _obj.voucher.basics.description +'. Terms- '+ _obj.voucher.terms +'. VALID UNTIL '+ Utils.formatDate(new Date(_obj.voucher.validity.end_date)) +'. Track and redeem your rewards easily, get Twyst http://twy.st/app';
	}
	SMS.sendSms(_obj.phone, _message, 'VOUCHER_MESSAGE');
}

function isVoucherInApp(outlet) {
	return outlet.voucher_in_app;
}