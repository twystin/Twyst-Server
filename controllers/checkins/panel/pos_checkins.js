var async = require('async');
var superagent = require('superagent');
var agent1 = superagent.agent();
var settings = require('../../config/settings');

module.exports.poscheckin = poscheckin = function(req,res){

//	console.log(req.body.outlet);
//	console.log(req.body.rows)
	var rows = JSON.parse(req.body.rows);
	var count = req.body.count;
//	console.log(rows);
    var root_url = settings.values.config[settings.values.env].server;
    if(root_url === 'http://localhost') {
        root_url += ':' + settings.values.config[settings.values.env].port;
    }
	async.waterfall([
        function one(callback) {
            agent1
                .post(root_url + '/api/v1/auth/login')
                .type('form') // send request in form format
                .send({
                    username: 'theakitchen',
                    password: 'theakitchen'
                })
                .end(function(err, res) {
            //console.log("response for login is ", res.statusCode);
                    callback(null);
                });
                
        },

        function two(callback) {
            for (var i = 0; i < count; i++) {
                // console.log("i is ", i);
                var p = rows[i].Payment;
                var m = rows[i].Mobile;
                if (validatePayment(rows[i].Payment) == true && validateMobile(rows[i].Mobile) == true && i!=0) {
                    agent1
                        .post(root_url + '/api/v2/checkins')
                        .send({
                            phone: rows[i].Mobile,
                            outlet: req.body.outlet,
                            location: 'HOME_DELIVERY',
                            checkin_type: 'POS',
                            checkin_code: 'POS'
                        })
                        .end(function(err, res) {
                            callback(null);
                        });
                }
            }
            
        }], 
        function(err, results) { 
        
        });

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

	function validatePayment(data) {
	    var x = Math.floor(data);
	    if (x >= 100) {
	        return true;
	    } else {
	        return false;
	    }
	}
}