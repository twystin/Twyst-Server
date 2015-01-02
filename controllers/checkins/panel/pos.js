var AutoCheckinCtrl = require('../../checkins/auto_checkin'),
	async = require('async');

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
		async.each(rows, function (phone, callback) {
			if(validateMobile(phone)) {
				var auto_checkin_obj = {
		            'phone': phone,
		            'outlet': req.body.outlet,
		            'location': 'HOME_DELIVERY',
		            'created_date': new Date(),
		            'checkin_type' : 'POS',
		            'checkin_code' : 'POS'
		        };
			    AutoCheckinCtrl.autoCheckin(auto_checkin_obj, function (result) {
			    	callback();
			    });
			}
			else {
				callback();
			}
		}, function (err) {
			res.send(200, {
				'status': 'success',
				'message': 'Checked in successfully',
				'info': null
			})
		})
	}

	function validateMobile(phone) {
	    if (phone.length < 10 || phone.length > 12) {
	        return false;
	    }
	    var lastTenChar = phone.charAt(phone.length - 10);
	    if (lastTenChar == "7" || lastTenChar == "8" || lastTenChar == "9") {
	        return true;
	    }
	    return false;
	}
};