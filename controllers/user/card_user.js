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
					
			Account.findById(userFound[0]._id, function (err, account) {
				if(err) console.log(err)
					console.log(account)
				if(account.profile === undefined)	{
					account.profile.first_name = user.firstName;
					account.profile.middle_name = user.middleName;
					account.profile.last_name = user.lastName;
					account.profile.email = user.email;
					account.profile.bday.d = user.date;
					account.profile.bday.m = user.month;
					account,profile.bday.y = user.year;
					console.log('All Updated');
					sendEmailAndSms(user);
				}
				else {
					if(account.profile !== undefined &&
					(account.profile.first_name === undefined || account.profile.first_name === '')){
					account.profile.first_name = user.firstName;
					console.log('firstName Updated');
					}

					if(account.profile !== undefined &&
						(account.profile.middle_name === undefined || account.profile.middle_name === '')){
						account.profile.middle_name = user.middleName;
						console.log('middleName Updated');
					}
					if(account.profile !== undefined &&
						(account.profile.last_name=== undefined || account.profile.last_name === '')){
						account.profile.last_name = user.lastName;
						console.log('lastName Updated');
					}

					if(account.profile !== undefined &&
						(account.profile.email === undefined || account.profile.email === '')){
						account.profile.email = user.email;
						console.log('email Updated');
						sendEmailAndSms(user);

					}
					if(account.profile !== undefined && 
						(account.profile.bday === undefined || account.profile.bday === '')){
						account.profile.bday.d = user.date;
						account.profile.bday.m = user.month;
						account.profile.bday.y = user.year;
						console.log('bday Updated');
					}
					else {
						if(account.profile !== undefined && account.profile.bday !== undefined && 
						(account.profile.bday.d === undefined || account.profile.bday.d === '')){
						account.profile.bday.d = user.date;
						console.log('date Updated');
						}
						if(account.profile !== undefined && account.profile.bday !== undefined && 
							(account.profile.bday.m === undefined || account.profile.bday.m === '')){
							account.profile.bday.m = user.month;
							console.log('month Updated');
						}
						if(account.profile !== undefined && account.profile.bday !== undefined && 
							(account.profile.bday.y === undefined || account.profile.bday.y === '')){
							account.profile.bday.y = user.year;
							console.log('year Updated');
						}
					} 	
				}
				
					
				account.save(function(err) {
			        if (err) return next(err);
			        callback('Updated');
			    });
			});		
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
	if(user.email !== undefined && user.email !== '' && user.email !== null) {
		EmailAndSmsSender.sendWelcomeMail(user.email);
		SMS.sendSms(user.mobile, twyst_welcome_message, 'WELCOME_MESSAGE');	
	}
	

}