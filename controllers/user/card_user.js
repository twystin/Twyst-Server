'use strict';
var fs = require('fs'),
  _ = require('underscore'),
  mongoose = require('mongoose');
var Account = mongoose.model('Account');
var EmailAndSmsSender = require('../welcome_email_sms');
var SMS = require('../../common/smsSender');
var keygen = require("keygenerator");

var async = require('async');
var EmailSender = require('../mailer/mailer.js');
module.exports.populateCardUser = function (req, res) {
  if(req.body.panel) {
    updateUser(req.body.userData, function(err) {
      if(err) {
        console.log(err);  
      }
    })
  }
  else {
    var allUsers = req.body.userData;
    var result = true;
    async.each(allUsers, updateUser, function(err){
      if(err) {
        console.log(err);  
      }
        
    });  
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
      if(userFound[0]) {
        Account.findById(userFound[0]._id, function (err, account) {
          if(err) console.log(err)
            //console.log(account);
          var secret_code = keygen.session_id();
          if(account.profile === undefined) {
            account.profile.first_name = user.firstName;
            account.profile.middle_name = user.middleName;
            account.profile.last_name = user.lastName;
            account.profile.email = user.email;
            account.profile.bday.d = user.date;
            account.profile.bday.m = user.month;
            account.profile.bday.y = user.year;
            account.validated = account.validated || {};
            account.validated.email_validated = account.validated.email_validated || {};
            account.validated.email_validated.token = secret_code;
            console.log('All Updated');
            sendEmailAndSms(user, 'APP_UPGRADE', secret_code);
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
              account.validated = account.validated || {};
              account.validated.email_validated = account.validated.email_validated || {};
              account.validated.email_validated.token = secret_code;
              account.validated.email_validated.is_welcome_mailer_sent = true;
              console.log('email Updated');
              sendEmailAndSms(user, 'APP_UPGRADE', secret_code);
            }
            else if(account.profile !== undefined && account.profile.email !== undefined && account.validated
              && account.validated.email_validated && account.validated.email_validated.status && 
              (!account.validated.email_validated.is_welcome_mailer_sent)){
                account.validated.email_validated.is_welcome_mailer_sent = true;
                sendEmailAndSms(user, 'WELCOME_MAILER', null);  
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
              console.log('date Updated ' + account.profile.bday.d + " " + user.date);
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

          delete account.__v;
          account.save(function(err) {
                if (err) return next(err);
                callback('User Details Successfully Updated');
            });
        });  
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
        callback(null);
      }
      else {
        callback(user);
      }
    }
  });
}

var sendEmailAndSms = function(user, type, secret_code ) {
  if(user.email !== undefined && user.email !== '' && user.email !== null && type === 'APP_UPGRADE') {
    var email_object = {
      email: user.email,
      data: {
        link: null
      },
      type: type,
      phone: user.mobile
    };

    email_object.data.link = 'http://localhost:3000/verify_email/' + true +'/'+  secret_code ;

    EmailAndSmsSender.sendWelcomeMail(email_object);

    SMS.sendSms(user.mobile,
    'Welcome to Twyst! We have sent you a welcome mail to ' +user.email+'. Please check your mail, and get the Twyst app to discover a world of dining rewards! If the ID is incorrect, please write to us at support@twyst.in.' , type);
  }
  else if (user.email !== undefined && user.email !== '' && user.email !== null && type === 'WELCOME_MAILER') {
    var email_object = {
      email: user.email,
      data: {
        link: null
      },
      type: type,
      phone: user.mobile
    };
    EmailAndSmsSender.sendWelcomeMail(email_object); 
  }


}
