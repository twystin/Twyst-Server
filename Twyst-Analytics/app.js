var mongoose = require('mongoose');
require('../config/config_models')();

mongoose.connect('mongodb://localhost/twyst');

var async = require('async');

var Checkin = mongoose.model('Checkin');
var Program = mongoose.model('Program');

var conn2 = mongoose.createConnection('mongodb://localhost/twyst_analytics');
var user_data = require('./models/users/data');
var metric = require('./models/users/metric');
var UserData = conn2.model('UserData');
var UserMetric = conn2.model('UserMetric');
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
		    TOTAL_USERS_COUNT: function(callback) {
		    	getTotalUsersCount(program._id, outlet, callback);
		    },
		    TOTAL_USERS_COUNT_WITH_CHECKINS_GT_ONE: function(callback) {
		    	getUsersCountWithCheckinGtOne(program._id, outlet, callback);
		    },
		    CROSS_VISITING_USERS: function(callback) {
		    	if(program.outlets.length < 2) {
		    		callback(null, 0);
		    	}
		    	else {
		    		getCrossVisitingUsersCount(program._id, callback);
		    	}
		    }
		}, function(err, results) {
			console.log(results)
		    saveInUserMetric(outlet, program._id, results);
		});
}

function saveInUserMetric(outlet, program, data) {
	var obj = {
		outlet: outlet,
		program: program,
		total_users: data.TOTAL_USERS_COUNT,
		total_users_with_checkins_gt_one: data.TOTAL_USERS_COUNT_WITH_CHECKINS_GT_ONE,
		cross_visiting_users: data.CROSS_VISITING_USERS
	}

	var usermetric = new UserMetric(obj);
	usermetric.save(function (err, data) {
		console.log(err || 'Success');
	})
}

function getTotalUsersCount(program, outlet, callback) {
	Checkin.find({outlet: outlet, checkin_program: program}).
		distinct('phone').exec(function (err, docs) {
			if(!docs) {
				docs = [];
			}
		callback(null, docs.length);
	})
}

function getUsersCountWithCheckinGtOne(program, outlet, callback) {
	var o = {};
	o.map = function () { 
		emit(this.phone, 1) 
	}
	o.reduce = function (k, values) { 
		return values.length;
	}
	o.query = {outlet: outlet, checkin_program: program};
	o.out = { replace: 'createdCollectionNameForResults' }
	o.verbose = true;
	Checkin.mapReduce(o, function (err, model, stats) {
	  console.log('map reduce took %d ms', stats.processtime)
	  model.find({}, function (err, docs) {
	  	var c = 0;
	    docs.forEach(function (d) {
	    	if(d.value > 1) {
	    		c += 1;
	    	}
	    })
	    callback(null, c);
	  });
	});
}

function getCrossVisitingUsersCount(program, callback) {
	var o = {};
	o.query = {
		checkin_program: program
	}
	o.map = function () { 
		emit(this.phone, this.outlet) 
	}	
	o.reduce = function (k, values) {
		var unique = [];
		values.forEach (function (v) {
			var flag = 1;
			unique.forEach(function (u){
				if(u.toString() == v.toString()) {
					flag = 0;
				}
			})
			if(flag){
				unique.push(v);
			}
		})
		return unique.length;
	}
	o.finalize = function (k, reduced) {
		if(typeof reduced === 'object') {
			return 0;
		}
		return reduced;
	}
	o.out = { replace: 'createdCollectionNameForResults' }
	o.verbose = true;
	Checkin.mapReduce(o, function (err, model, stats) {
	  console.log('map reduce took %d ms', stats.processtime)
	  model.find({}, function (err, docs) {
	  	//console.log(docs)
	  	var c = 0;
	    docs.forEach(function (d) {
	    	if(d.value > 1) {
	    		c += 1;
	    	}
	    })
	    callback(null, c);
	  });
	});
}