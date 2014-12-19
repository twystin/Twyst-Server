var settings = require('../../../config/settings');
var CheckinCtrl = require('../panel/main');
var SMS = require('../../../common/smsSender');
var AutoCheckinCtrl = require('../../checkins/auto_checkin')

module.exports.poscheckin = function(req,res){
	var count = req.body.rows.length;
	for (var i = 0; i < count; i++){
		if(validateMobile(req.body.rows[i])===true){	
			console.log(req.body.rows[i]);
			var auto_checkin_obj = {
		                    'phone': req.body.rows[i],
		                    'outlet': req.body.outlet,
		                    'location': 'HOME_DELIVERY',
		                    'created_date': Date.now(),
		                    'checkin_type' : 'POS',
		                    'checkin_code' : 'POS'
		                };
		    AutoCheckinCtrl.autoCheckin(auto_checkin_obj);
		}
	}
	function validateMobile(data) {
	    if (data.length < 10 || data.length > 12) {
	        return false;
	    }
	    var lastTenChar = data.charAt(data.length - 10);
	    if (lastTenChar == "7" || lastTenChar == "8" || lastTenChar == "9") {
	        return true;
	    }
	    return false;
	}
};