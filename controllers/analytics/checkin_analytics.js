var mongoose = require('mongoose');
var Checkin = mongoose.model('Checkin');
var Outlet = mongoose.model('Outlet');
var async = require('async');

var _ = require('underscore');


module.exports.getAllCheckins = function (req, res) {
	// 7 days earlier

	var ranges = [];

	for(var i = 7; i >= 0; i--) {
		
		var now = new Date();
		now.setHours(0,0,0,0);
		now.setDate(now.getDate()+1);
		ranges.push(now.setDate(now.getDate()-i));
	}

	Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get checkin analytics',
				'info': JSON.stringify(err)
			});
		}
		else {
			
			getUniqueCheckins(outlets);
		}
	});

	function getUniqueCheckins(outlets) {
		
		async.forEach([1,2,3,4,5,6,7], function(key) {
			
			Checkin.find({
				checkin_type: {
					$ne: "BATCH"
				},
				outlet: {
        				$in: outlets.map(
        					function(outlet){ 
        						return mongoose.Types.ObjectId(String(outlet._id)); 
        				})},
				'created_date': 
					{ $gt: new Date(ranges[key-1]), 
						$lt: new Date(ranges[key]) }}, 
				function (err, suc) {
					
					if(err) {
						suc = [];
					}
					
					getCheckinCounts(ranges[key-1], suc);

			});
		});
	}

	function getCheckinCounts(low, data) {

		var unique_checkins = _.uniq(data, function (obj) {
			return obj.phone;
		})

		var unique_count = unique_checkins.length;
		var total_count = data.length;

		assembleResult(low, total_count, unique_count);
	}

	var checkin_data_all = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};

	var checkin_data_unique = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};

	var counter = 0;

	function assembleResult(date, total_count, unique_count) {
		
		checkin_data_all.labels.push(new Date(date));
		checkin_data_all.datasets[0].data.push(total_count);
		checkin_data_unique.labels.push(date);
		checkin_data_unique.datasets[0].data.push(unique_count);

		++counter;

		if(counter === 7) {

			sortResults (checkin_data_all, checkin_data_unique);
		}
	}

	function sortResults (checkin_data_all, checkin_data_unique) {

		checkin_data_all = insertionSort(checkin_data_all);

		checkin_data_unique = insertionSort(checkin_data_unique);

		checkin_data_all = formateDate(checkin_data_all);

		var checkin_data = {};
		checkin_data.checkin_data_all = checkin_data_all;
		checkin_data.checkin_data_unique = checkin_data_unique;

		res.send(200, {
			'status': 'success',
			'message': 'Got checkin analytics',
			'info': JSON.stringify(checkin_data)
		});
	}

	function formateDate (obj) {

		for(var j = 0; j < obj.labels.length; j++) {

			obj.labels[j] = obj.labels[j].toDateString();
		}

		return obj;
	}

	function insertionSort(obj) {

		for(var j = 1; j < obj.labels.length; j++) {
			var key = obj.labels[j];
			var key2 = obj.datasets[0].data[j];
			var i = j - 1;

			while(i >= 0 && obj.labels[i] > key) {
				obj.labels[i+1] = obj.labels[i];
				obj.datasets[0].data[i+1] = obj.datasets[0].data[i];
				i = i - 1;
			}

			obj.labels[i+1] = key;
			obj.datasets[0].data[i+1] = key2;
		}

		return obj;
	}
}

module.exports.getAllCheckinCount = function (req, res) { 

	Outlet.find({'outlet_meta.accounts': req.user._id}, function (err, outlets) {
		if(err || outlets.length < 1) {
			res.send(400,{
				'status': 'error',
				'message': 'Unable to get checkin analytics',
				'info': JSON.stringify(err)
			});
		}
		else {
			
			getTotalCheckins(outlets);
		}
	});

	function getTotalCheckins(outlets) {

		Checkin.distinct('phone',{
			outlet: {
    				$in: outlets.map(
    					function(outlet){ 
    						return mongoose.Types.ObjectId(String(outlet._id)); 
    				})}}, function (err, data) {
				
				if(err) {
					res.send(400,{
						'status': 'error',
						'message': 'Unable to get checkin count',
						'info': JSON.stringify(err)
					});
				}
				else {
					var count = data.length;
					res.send(200,{
						'status': 'success',
						'message': 'Got checkin count successfully',
						'info': count
					});
				}
		});
	}
}