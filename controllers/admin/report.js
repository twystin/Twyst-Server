var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Offer = mongoose.model('Offer');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var async = require('async');

module.exports.getSummary= function (req, res) {
	var startDate = new Date(req.body.start_date);
	var endDate = new Date(req.body.end_date);
	var checkinType = req.body.checkin_type;
	console.log(startDate + ' ' + endDate + " " + checkinType);
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
			    	getRedeemCount(startDate, endDate, callback);
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
				"checkin_date": {$gt: new Date(startDate),$lt: new Date(endDate)}}},
	    
	    //{ $project : { checkin_type :  "$checkin_type" } } ,
	    //{ $group: {_id: {checkin_type: "$checkin_type" }, bookCount: { $sum: 1 }}},
	    
	    { $project : { date : { $dateToString: { format: "%d-%m", date: "$checkin_date"}},  checkin_type: "$checkin_type", outlet: "$outlet" } } , 
	    { $group : { _id : {date:"$date", outlet: "$outlet", checkin_type: "$checkin_type"} , checkin_count : { $sum : 1 } } },
	    { $sort : { "_id.date" : 1 } },
	     function(err, data) {
	     	
	    	console.log(data);
	    	callback(null, data);
	    }

	  
	)
		
}

function getRedeemCount(startDate, endDate, callback) {
	Voucher.aggregate(
		{$match: {'basics.status': 'merchant redeemed','used_details.used_time': {
			$gt: new Date(startDate), 
			$lt: new Date(endDate)
			}
		}},
		{$project: {usedDate: {$dateToString : { format: "%d-%m", date: "$used_details.used_time"}}, outlet: "$used_details.used_at"}},
		{$group: {_id: {usedDate: "$usedDate", outlet: "$outlet"}, redeem_count: {$sum: 1}}},
		{$sort : { "_id.usedDate" : 1 } },
		function(err, redeem_data) {
	    	
	    	redeem_data.forEach(function(data){
	    		console.log(data._id.usedDate + "  " + data._id.outlet + ' ' + data.redeem_count);	
	    	})
	    	callback(null, redeem_data);
	    }
	)
}




