var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('./config/config_models')();

var Checkin = mongoose.model('Checkin');
var voucher_gen = require('./voucherGenMistake')
mongoose.connect('mongodb://twyst.in/twyst');

Checkin.aggregate({ $match: {
	    'checkin_program': mongoose.Types.ObjectId("535fb8feb7f678a830000046"),
      'checkin_type': 'PANEL',
      "created_date" : {
            $lt: new Date("2014-06-16T00:00:58.669Z")
        }
    }},
  	{ 
  		$group: {
    		_id: { 
    			phone: "$phone" 
    		},
    	count: { 
    		$sum: 1 
    	} 
  	}}, 
  	{ 
  		$match: { 
    		count: { 
    			$gte: 1
    		} 
  	} },
  	{ 
  		$sort : { 
  			count : -1
  		} 
  	},
  	{ 
  		$limit : 2000 
  	}, function (err, checkins) {
        breakUsers(checkins);  		
});

function breakUsers(checkins) {
  var i = 0;
  var rem = checkins.length;
  checkins.forEach(function (obj) {
    if(obj.count === 3 || obj.count === 5 || obj.count === 7) {
      setTimeout(function () {
        voucher_gen.readProgramAndPopulateTiers(
            mongoose.Types.ObjectId("531ec1c05b2e10b974000006"),
            obj._id.phone,
            true
        )
      }, 1000 * ++i);
    }
  })
}

// Mark all the ones already sent and QR