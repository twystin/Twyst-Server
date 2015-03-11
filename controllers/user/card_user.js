'use strict';
var fs = require('fs'),
	_ = require('underscore'),
	mongoose = require('mongoose');
var Account = mongoose.model('Account');
var EmailAndSmsSender = require('../welcome_email_sms');
var SMS = require('../../common/smsSender');
var twyst_welcome_message = 'Welcome To Twyst Rewards Program';

module.exports.populateCardUser = function (req, res) {
	var allUsers = req.body.userData;
	var result = true;
	for  (var i = 0; i < allUsers.length; i ++) {
		updateUser(allUsers[i], function(data){	
			console.log(data);
		})		
	}
	
	res.send(200, {
		'status': 'success',
		'message': 'Updated Succcessfully',
		'info': 'success'
	});

}

var updateUser = function(user, callback){
	if(user.mobile !== undefined) {
		findUser(user.mobile, function(userFound){
			if(userFound !== null && userFound[0] !== undefined) {
				if((userFound[0].email == undefined || userFound[0].email == null) && 
					(userFound[0].name == undefined || userFound[0].name == null) ) {
					console.log('both should be update');
					Account.findOneAndUpdate({ phone: user.mobile},  
						{$set: {"name": user.name, "email": user.email} }, 
						
						function(err, updatedUser) {
							if (err) {
								console.log(err);
								callback(false);
								
							} else if(updatedUser) {
								sendEmailAndSms(user);		
								callback(true);																								
							}	
						}
					);		

				}
				else if(userFound[0].email == undefined || userFound[0].email == null) {
					console.log('only email should be update');
					Account.findOneAndUpdate({ phone: user.mobile},  
						{$set: {"email": user.email} }, 
						
						function(err, updatedUser) {
							if (err) {
								console.log(err);
								callback(false);
								
							} else {
								if(updatedUser) {
									sendEmailAndSms(user);		
								}
								
								callback(true);
							}	
						}
					);				
				}
				else if(userFound[0].name == undefined || userFound[0].name == null) {
					console.log('only name should be update');
					Account.findOneAndUpdate({ phone: user.mobile},  
						{$set: {"name": user.name} }, 
						
						function(err, updatedUser) {
							if (err) {
								console.log(err);
								callback(false);
								
							} else {				
								callback(true);
							}	
						}
					);				
				}
				else {
					console.log('nothing to update ');
					callback(true);
				}	
			}		
		})	
	}
}

var  findUser = function(phone, callback) {
	Account.find({phone: phone}, function (err, user) {			
		if(err) {
			console.log(err);
		}
		else {
			if(user === null) {
				callback();
			}
			else {
				callback(user);
			}
		}
	});
}

var sendEmailAndSms = function(user) {
	//console.log(user);
	EmailAndSmsSender.sendWelcomeMail(user.email);
	SMS.sendSms(user.mobile, twyst_welcome_message, 'WELCOME_MESSAGE');

}