var settings = require('../../../config/settings');
var CheckinCtrl = require('../panel/main');
var SMS = require('../../../common/smsSender');
var AutoCheckinCtrl = require('../../checkins/auto_checkin')

module.exports.poscheckin = function(req,res){
	var count = req.body.rows.length;
	for (var i = 0; i < count; i++){
		console.log(req.body.rows[0]);
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
};