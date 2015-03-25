var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');

module.exports.register = function(req, res, next) {
	Account.register(new Account(req.body), req.body.password, function(err, account) {
	    if (err) {
	    	console.log(err);
	    	if(err.message === 'User already exists with username '+ req.body.username){
	    		res.send({	'status' : 'error',
	        		'message' : 'Error: User Name Already Exist',
	        		'info':  err 
	        	});	
	    	}
	    	else {
	    		res.send({	'status' : 'error',
	        		'message' : 'Error in Creating User',
	        		'info':  err 
	        	});	
	    	}
	        
	    } 
	    else {
	    	grantAccess(req.body, account);
	    	res.send({	'status': 'success',
						'message' : 'Account created',
						'info' : account
			}); 
	    }   	
	});
};

function grantAccess (body, user) {

	var account;
	var outlet;
	if(body && body.account) {
		account = body.account;
	}
	else {
		account = null;
	}

	if(body && body.outlet) {
		outlet = body.outlet;
	}
	else {
		outlet = null;
	}

	if(user && user.role === 5) {
		grantOutletAccess();
	}
	else {
		grantAllAccess();
	}

	function grantOutletAccess () {
		Program.find({outlets: outlet}, function(err,programs) {
			if (err) {
				
			} else {
				if(programs === null){

				}
				else {
					programs.forEach(function (program) {
						program.accounts.push(user._id);
						program.save();
					});
				}
			}
		});

		Outlet.findOne({_id: outlet}, function(err,outlet) {
			if (err) {
				
			} else {
				if(outlet === null){

				}
				else {
					outlet.outlet_meta.accounts.push(user._id);
					outlet.save();
				}
			}
		});
	}

	function grantAllAccess () {
		Program.find({accounts: account}, function(err,programs) {
			if (err) {
				
			} else {
				if(programs === null){

				}
				else {
					programs.forEach(function (program) {
						program.accounts.push(user._id);
						program.save();
					})
				}
			}
		});
		Outlet.find({'outlet_meta.accounts': account}, function(err,outlets) {
			if (err) {
				
			} else {
				if(outlets === null){

				}
				else {
					outlets.forEach(function (outlet) {
						outlet.outlet_meta.accounts.push(user._id);
						outlet.save();
					})
				}
			}
		});
	} 
}

module.exports.getManagers = function(req,res) {
	Account.find({account: req.params.user_id}, function(err,users) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Error getting list of users',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Got all users',
						'info': JSON.stringify(users)
			});
		}
	}); 
}