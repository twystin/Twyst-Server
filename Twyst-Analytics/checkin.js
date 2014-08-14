var mongoose = require('mongoose');
require('../config/config_models')();

mongoose.connect('mongodb://localhost/twyst');

var async = require('async');

var Checkin = mongoose.model('Checkin');
var Program = mongoose.model('Program');

var conn2 = mongoose.createConnection('mongodb://localhost/twyst_analytics');
//var checkin_data = require('./models/checkins/data');
var checkin_metric = require('./models/checkins/metric');
//var CheckinData = conn2.model('CheckinData');
var CheckinMetric = conn2.model('CheckinMetric');
getProgram();
function getProgram () {
	Program.find({}, function (err, programs) {
		if(err) {
			console.log(err);
		}
		else {
			var i = 0;
			programs.forEach(function (p) {
				i++;
				setTimeout(function () {
					runUserMetric(p);
				}, i * 2000);
			})
		}
	})
}

function runUserMetric (program) {
	if(program.outlets && program.outlets.length > 0) {
		program.outlets.forEach (function (o) {
			runUserMetricInParallel(program, o);
		})
	}
}

function runUserMetricInParallel (program, outlet) {
	async.series({
		    TOTAL_CHECKIN_COUNT: function(callback) {
		    	getTotalCheckinCount(program._id, outlet, callback);
		    },
		    COUNT_BY_CHECKIN_TYPE: function(callback) {
		    	getCheckinCountByCheckinType(program._id, outlet, callback);
		    },
		    COUNT_BY_CHECKIN_LOCATION: function(callback) {
		    	getCheckinCountByCheckinLocation(program._id, outlet, callback);
		    },
		    CHECKIN_BY_DAY_OF_WEEK: function(callback) {
		    	getCheckinByDayOfWeek(program._id, outlet, callback);
		    }		    
		}, function(err, results) {
			console.log(results)
		    saveInCheckinMetric(outlet, program, results);
		});
}

function saveInCheckinMetric(outlet, program, data) {
	CheckinMetric.findOne({outlet: outlet, program: program}, function (err, checkinmetric){
		if(err) {
			console.log(err);
		}
		else {
			checkinmetric = checkinmetric || new CheckinMetric();
			checkinmetric.outlet = outlet,
			checkinmetric.program = program._id,
			checkinmetric.total_checkins = data.TOTAL_CHECKIN_COUNT,
			checkinmetric.avg_daily_checkins = getAvgCheckin(data.TOTAL_CHECKIN_COUNT, program),
			checkinmetric.count_by_checkin_type = data.COUNT_BY_CHECKIN_TYPE,
			checkinmetric.count_by_checkin_location = data.COUNT_BY_CHECKIN_LOCATION,
			checkinmetric.avg_daily_checkins_by_day_of_week = data.CHECKIN_BY_DAY_OF_WEEK
			
			checkinmetric.save(function (err, success) {
				console.log(err || 'success');
			})
		}
	});
}

function getCheckinByDayOfWeek(program, outlet, callback) {
	var o = {};
	o.query = {outlet: outlet, checkin_program: program};
	o.map = function () { 
		var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var day;
		day = new Date(this.checkin_date).getDay();
		emit(day, 1) 
	}
	o.reduce = function (k, values) { 
		var count = 0;
		values.forEach(function (v) {
			count += v;
		})
		return count;
	}
	o.out = { replace: 'createdCollectionNameForResults' }
	o.verbose = true;
	Checkin.mapReduce(o, function (err, model, stats) {
		console.log(err);
	  console.log('map reduce took %d ms', stats.processtime)
	  model.find({}, function (err, docs) {
	   	callback(null, docs);
	  });
	});
}

function getCheckinCountByCheckinLocation(program, outlet, callback) {
	Checkin.aggregate({$match: {
					checkin_program: program, 
					outlet: outlet,
					location: {
						$exists:true
					}
				}},
				{ $group: 
					{ _id: '$location', count: { $sum: 1 }}
				}, function (err, op) {
			callback(null, op);
	});
}

function getCheckinCountByCheckinType(program, outlet, callback) {
	Checkin.aggregate({$match: {checkin_program: program, outlet: outlet}},
				{ $group: 
					{ _id: '$checkin_type', count: { $sum: 1 }}
				}, function (err, op) {
			callback(null, op);
	});
}

function getTotalCheckinCount(program, outlet, callback) {
	Checkin.count({checkin_program: program, outlet: outlet}, function (err, count) {
		callback(null, count || 0);
	})
}

function getAvgCheckin(TOTAL_CHECKIN_COUNT, program) {
	if(TOTAL_CHECKIN_COUNT === 0) {
		return 0;
	}
	return TOTAL_CHECKIN_COUNT / ((new Date() - new Date(program.validity.earn_start)) / (24 * 60 * 60 * 1000));
}