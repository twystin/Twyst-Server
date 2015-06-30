var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var Notif = mongoose.model('Notif');
var async = require('async');

module.exports.getSummary= function (req, res) {
	var startDate = new Date(req.body.start_date);
	var endDate = new Date(req.body.end_date);
	endDate.setHours(23,59,59,999);
	var checkinType = req.body.checkin_type;
	var voucherType = req.body.voucher_type;
	console.log(startDate + ' ' + endDate + " " + checkinType + " " + voucherType);
	if(!startDate && !endDate) {
		res.send(400,{
			'status': 'error',
			'message': 'Please select a date range',
			'info': 'date range'
		});
	}
	else {
		runInParallel(startDate, endDate, checkinType);
	}

	function runInParallel(startDate, endDate, checkinType) {
		if(checkinType !== 'REDEEM') {
			async.parallel({
			    checkin_count: function(callback) {
			    	getCheckins(startDate, endDate, checkinType, callback);
			    }
			}, function(err, results) {
			    if(err) {
			    	res.send(200, {
				    	'status' : 'error',
		                'message' : 'Error getting dashboard data',
		                'info': err
		            });
			    }
			    else {
			    	res.send(200, {
				    	'status' : 'success',
		                'message' : 'Got dashboard data',
		                'info': results.checkin_count
		            });
			    }
			});
		}
		else {
			async.parallel({
			    redeem_count: function(callback) {
			    	getRedeemCount(startDate, endDate, voucherType, callback);
			    }
			}, function(err, results) {
			    if(err) {
			    	res.send(200, {
				    	'status' : 'error',
		                'message' : 'Error getting dashboard data',
		                'info': err
		            });
			    }
			    else {
			    
			    	res.send(200, {
				    	'status' : 'success',
		                'message' : 'Got dashboard data',
		                'info': results.redeem_count
		            });
			    }
			});
		}
		
	}
}


function getCheckins(startDate, endDate, checkinType, callback) {
	Checkin.aggregate(
			{$match: {"checkin_type": checkinType, 
				"checkin_date": {$gte: startDate, $lte: endDate}}},
	    
	    //{ $project : { checkin_type :  "$checkin_type" } } ,
	    //{ $group: {_id: {checkin_type: "$checkin_type" }, bookCount: { $sum: 1 }}},
	    
	    { $project : { date : { $dateToString: { format: "%d-%m", date: "$checkin_date"}},  checkin_type: "$checkin_type", outlet: "$outlet" } } , 
	    { $group : { _id : {date:"$date", outlet: "$outlet", checkin_type: "$checkin_type"} , checkin_count : { $sum : 1 } } },
	    { $sort : { "_id.date" : 1 } },
	     function(err, data) {
	     	var allCheckin = []
	    	
	    	_.map(data, function(check) {
	    		var checkin_obj = {
	    			'date': check._id.date,
	    			'outlet': check._id.outlet,
	    			'checkin_count': check.checkin_count
	    		}
	    		allCheckin.push(checkin_obj);
	    	})
	    	var finalCount = {};

	    	if(allCheckin.length) {
	    		for (var i = 0; i < allCheckin.length ; i++) {
		    		for(var j = i; j< allCheckin.length; j++) {

		    			//console.log(allCheckin[i].date.toString() + "  " + allCheckin[j].date.toString())
		    			if(allCheckin[i].date.toString() === allCheckin[j].date.toString()) {
		    				if(!finalCount[allCheckin[i].date]) {
		    					finalCount[allCheckin[i].date] = [];
		    						
		    				}
		    				var a = {
		    					'outlet': allCheckin[j].outlet,
		    					'count': allCheckin[j].checkin_count
		    				}
		    				//console.log('here ' + allCheckin[j].outlet + " " + allCheckin[j].checkin_count);
		    				finalCount[allCheckin[i].date].push(a);		    				
		    			}
		    			break;
		    		}

		    	};	
		    	finalCount.isCheckin = true;
	    	}
	    	
	    	//console.log(JSON.stringify(finalCount));
	    	callback(null, finalCount);
	    }
	)	
}

function getRedeemCount(startDate, endDate, voucherType, callback) {
	Voucher.aggregate(
		{$match: {'basics.gen_type': voucherType, 'basics.status': 'merchant redeemed','used_details.used_time': {
			$gte: startDate, 
			$lte: endDate
			}
		}},
		{$project: {usedDate: {$dateToString : { format: "%d-%m", date: "$used_details.used_time"}}, outlet: "$used_details.used_at"}},
		{$group: {_id: {usedDate: "$usedDate", outlet: "$outlet"}, redeem_count: {$sum: 1}}},
		{$sort : { "_id.usedDate" : 1 } },
		function(err, redeem_data) {
	    	var allRedeem = []
	    	_.map(redeem_data, function(redeem) {
	    		var redeem_obj = {
	    			'date': redeem._id.usedDate,
	    			'outlet': redeem._id.outlet,
	    			'redeem_count': redeem.redeem_count
	    		}
	    		allRedeem.push(redeem_obj	);
	    	})
	    	var finalRedeem = {};
	    	
	    	if(allRedeem.length) {
	    		for (var i = 0; i < allRedeem.length ; i++) {
		    		for(var j = i; j< allRedeem.length; j++) {

		    			//console.log(allCheckin[i].date.toString() + "  " + allCheckin[j].date.toString())
		    			if(allRedeem[i].date.toString() === allRedeem[j].date.toString()) {
		    				if(!finalRedeem[allRedeem[i].date]) {
		    					finalRedeem[allRedeem[i].date] = [];
		    						
		    				}
		    				var a = {
		    					'outlet': allRedeem[j].outlet,
		    					'count': allRedeem[j].redeem_count
		    				}
		    				//console.log('here ' + allCheckin[j].outlet + " " + allCheckin[j].checkin_count);
		    				finalRedeem[allRedeem[i].date].push(a) 
		    				
		    			}
		    			break;
		    		}

		    	};
		    	finalRedeem.isRedeem = true;	
	    	}
	    	
	    	callback(null, finalRedeem);
	    }
	)
}

module.exports.getSmsReport = function(req, res) {
	var startDate = new Date(req.body.start_date);
	var endDate = new Date(req.body.end_date);
	endDate.setHours(23,59,59,999);
	Notif.find( { 'from': {$exists: true, $ne: 'TWYSTR'},  'logged_at': {$gte: startDate, $lte: endDate}}, {'logged_at': 1, 'phones': 1, 'from': 1, 'body': 1}, function(err, obj) {
		if(err) {
			console.log(err)
	    	res.send(200, {
		    	'status' : 'error',
                'message' : 'Error getting sms data',
                'info': err
            });
	    }
	    else {
	    	res.send(200, {
		    	'status' : 'success',
                'message' : 'Got dashboard data',
                'info': obj								
            });
	    }
		
	} );
}


