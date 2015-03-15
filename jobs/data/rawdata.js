var sys = require('sys');
var async = require("async");
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }

module.exports.execAsyncCommands = function(main_callback) {
	console.log("Are you here?")
	async.series({
	    accounts: function(callback) {
	    	exec("mongoexport --host 50.112.253.131:27017 --db twyst --collection accounts --csv --fields username,email,role,phone,gcm,_id,created_at -q '{created_at:{$gte:new Date(1420070400000)}}' --out ./data/accounts.csv", function (err, result) {
	    		if(err) {
	    			console.log(err	)
	    			return callback(err, null);
	    		}
	    		callback(null, result);
	    	});
	    },
	    checkins: function(callback) {
	    	exec("mongoexport --host 50.112.253.131:27017 --db twyst --collection checkins --csv --fields phone,outlet,checkin_code,checkin_type,created_date -q '{created_date:{$gte:new Date(1420070400000)}}' --out ./data/checkins.csv", function (err, result) {
	    		if(err) {
	    			return callback(err, null);
	    		}
	    		callback(null, result);
	    	});
	    },
	    vouchers: function(callback) {
	    	exec("mongoexport --host 50.112.253.131:27017 --db twyst --collection vouchers --csv --fields basics.code,basics.status,basics.description,basics.created_at,issue_details.issued_at,issue_details.issue_date,issue_details.issued_to,used_details.used_by,used_details.used_time,used_details.used_at,validity.end_date -q '{'basics.created_at':{$gte:new Date(1420070400000)}}' --out ./data/vouchers.csv", function (err, result) {
	    		if(err) {
	    			return callback(err, null);
	    		}
	    		callback(null, result);
	    	});
	    }
	}, function(err, results) {
	    main_callback(null, results);
	});
}