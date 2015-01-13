var AutoCheckinCtrl = require('../../checkins/auto_checkin'),
	async = require('async'),
	_ = require('underscore');

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
		if(phone) {
			var last_ten_char = phone.substr(phone.length - 10);
			if(isNumber(last_ten_char)
				&& isValidFirstDigit(last_ten_char)) {
				return true;
			}
		}
		return false;
	}

	function isValidFirstDigit(str) {
		if(str[0] == '7' 
			|| str[0] == '8'
			|| str[0] == '9') {
			return true;
		}
		return false;
	}

	function isNumber(str) {
        var numeric = /^-?[0-9]+$/;
        return numeric.test(str);
    }
};