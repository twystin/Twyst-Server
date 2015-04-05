var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');
require('../../config/config_models')();

mongoose.connect('127.0.0.1:27017/twyst');

var Account = mongoose.model('Account');


var q = Account.find({role: 6}).limit(6).skip(1);
q.exec(function (err, users) {
	if(err) {
		console.log(err);
	}
	else {
		async.each(users, function(user, callback) {
		    updateUser(user, function(res) {
		    	console.log(res);
		    })
	    }, function(err){
	        if( err ) {
	          console.log('An user failed to process');
	        } else {
	          console.log('All user have been migrated successfully');
	        }
	    }); 
	}
});


var updateUser = function(user, callback){
	if(user.facebook && user.facebook.email && !user.profile.email) {
		user.profile.first_name = user.facebook.name.split(' ')[0];
		user.profile.middle_name = user.facebook.name.split(' ')[1] || '';
		user.profile.last_name = user.facebook.name.split(' ')[2] || '';
		user.profile.email = user.facebook.email;
	}


	if(user.email && !user.profile.email) {
		user.profile.email = user.email;
	}

	if(user.social_graph && user.social_graph.facebook && user.social_graph.facebook.email && !user.profile.email){
		user.profile.first_name = user.social_graph.facebook.name.split(' ')[0];
		user.profile.middle_name = user.social_graph.facebook.name.split(' ')[1] || '';
		user.profile.last_name = user.social_graph.facebook.name.split(' ')[2] || '';
		user.profile.email = user.social_graph.facebook.email;
	}

	if(user.social_graph && user.social_graph.email && user.social_graph.email.email && !user.profile.email){		
		user.profile.email = user.social_graph.email.email;
	}

	if(user.name && !user.profile.first_name) {
		user.profile.first_name = user.name.split(' ')[0];
		user.profile.middle_name = user.name.split(' ')[1] || '';
		user.profile.last_name = user.name.split(' ')[2] || '';
	}
	user.save();
	callback('done');

}