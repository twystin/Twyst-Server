var Checkin_Main = require('./main'),
	Utils = require('../../../common/utilities'),
	SMS = require('../../../common/smsSender'),
	Helper = require('./helper');
var _ = require('underscore'),
	async = require('async');

module.exports.panelCheckin = function (req, res) {
	var _obj = {
		'phone': req.body.phone,
		'outlet': req.body.outlet,
		'location': req.body.location,
		'created_date': req.body.created_date,
		'is_batch': false
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
	            'checkin_code' : 'POS',
	            'is_batch': false
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
		var outlet_id = req.body.outlet;
	var _obj = {
        'phone': req.body.phone,
        'outlet': req.body.outlet,
        'location': req.body.location,
        'created_date': new Date(),
        'checkin_type' : 'BATCH',
        'checkin_code' : 'BATCH',
        'is_batch': true
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
			batchSmsHandler(data.info, message, sms_sender_id, outlet_id);
			res.send(200, {
				'status': 'success',
				'message': _obj.phone + ' Checked in successfully',
				'info': null
			})
		}
	});
}

module.exports.mrlCheckin = function(req, res){
	var _obj = {
		mrl_details: {
			m_id: req.body.m_id,
			t_id:	req.body.t_id,
			amount: req.body.amount,
			rrn: req.body.rrn
		},
        'phone': req.body.phone,
        'outlet': req.body.outlet,
        'location': req.body.location,
        'created_date': new Date(req.body.txn_time),
        'checkin_type' : 'MRL',
        'checkin_code' : 'MRL',
        'is_batch': false
    };
    console.log(JSON.stringify(_obj));
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


module.exports.bulkPanelCheckin = function (req, res) {
	
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
		async.each(rows, function (request, callback) {
			console.log(request)
			var _obj = {
	            'phone': request.mobile_number,
	            'outlet': request.outlet_id,
	            'location': 'HOME_DELIVERY',
	            'created_date': new Date(request.checkin_date),
	            'checkin_type' : 'PANEL',
	            'checkin_code' : 'PANEL',
	            'is_batch': false
	        };
		    Checkin_Main.checkin(_obj, function (err, data) {
				if(err) {
					console.log(err);
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

module.exports.autoCheckin = function (_obj, cb) {
	Checkin_Main.checkin(_obj, function (err, data) {
		if(err) {
			console.log(err);
		}
		else {
			smsHandler(data.info);
		}
	});
}

function batchSmsHandler(_obj, _message, sms_sender_id, outlet_id) {
	if(_obj.voucher) {
		_message = _message.replace(/xxxxxx/g, _obj.voucher.basics.code);
		SMS.sendSms(_obj.phone, _message, 'BATCH_CHECKIN_MESSAGE', sms_sender_id, outlet_id);
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
	        if(_obj.voucher && (new Date()).getDate() <= (_obj.created_date).getDate()) {
	        	_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst! Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +", reward unlocked! Your voucher for " + _obj.voucher.basics.description.replace(/Get/g, "")  +' will be available on Twyst AFTER 3 hrs, for use on your NEXT visit/order. View voucher details and TnC, or redeem, only on the Twyst app, at http://twyst.in/app. To unsubscribe, sms STOP ' +outlet.shortUrl[0]+ ' to 9266801954'
	        }
	        else if(_obj.voucher && (new Date()).getDate() > (_obj.created_date).getDate()) {
	        	_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst! Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +", reward unlocked! Your voucher for " + _obj.voucher.basics.description.replace(/Get/g, "")	 +' is NOW AVAILABLE on Twyst, for use on your NEXT visit/order. View voucher details and TnC, or redeem, only on the Twyst app, at http://twyst.in/app. To unsubscribe, sms STOP ' +outlet.shortUrl[0]+ ' to 9266801954'	        

	        }
	        else {
	        	_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst! Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Track your check-ins and vouchers on the Twyst app, at http://twyst.in/app. To unsubscribe, sms STOP '+outlet.shortUrl[0]+" to 9266801954"
	        }
	    }
	    else {
	    	if(_obj.voucher && (new Date()).getDate() <= (_obj.created_date).getDate()) {
	    		_message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +", reward unlocked! Your voucher for " + _obj.voucher.basics.description.replace(/Get/g, "")  +', will be available on Twyst AFTER 3 hrs, for use on your NEXT visit/order. View voucher details and TnC, or redeem, only on the Twyst app, at http://twyst.in/app'
	    	}
	        else if(_obj.voucher && (new Date()).getDate() > (_obj.created_date).getDate()) {
	        	_message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +", reward unlocked! Your voucher for " + _obj.voucher.basics.description.replace(/Get/g, "")  +', is NOW AVAILABLE on Twyst, for use on your NEXT visit/order. View voucher details and TnC, or redeem, only on the Twyst app, at http://twyst.in/app' 	
	        }
	        else {
	        	_message = 'Check-in successful at '+ outlet.basics.name +' on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Track your check-ins and vouchers on the Twyst app, at http://twyst.in/app'	    
	        }
	    }
	}
	else {
    	if(_obj.count === 0) {
			if(_obj.voucher) {
				_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst! Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. Reward unlocked - yay! You will soon receive your voucher code via SMS. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
			}
			else {
				_message = 'Welcome to the '+ outlet.basics.name +' rewards program on Twyst! Check-in successful on '+ Utils.formatDate(new Date(_obj.created_date)) +'. You are '+ _obj.reward_distance +' check-in(s) away from your next reward. Find '+ outlet.basics.name +' on Twyst: http://twyst.in/'+ outlet.shortUrl[0];
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
	SMS.sendSms(_obj.phone, _message, 'CHECKIN_MESSAGE', 'TWYSTR', outlet._id );
}



function isVoucherInApp(outlet) {
	return outlet.voucher_in_app;
}
