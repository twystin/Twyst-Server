var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var _ = require('underscore');
var keygen = require("keygenerator");
var crypto = require('crypto');

var email   = require("../node_modules/emailjs/email");

var server  = email.server.connect({
			user:       "jayram@twyst.in", 
			password:   "Singh@005", 
			host:       "smtp.gmail.com", 
			ssl:        true
});

module.exports.validationEmail = function(req, res) {
	//console.log(req.body);
	Account.find({username: req.body.username}, function (err, user) {
		if(err) {
			res.send(400, { 'status': 'error',
							'message': 'Account not found',
							'info': JSON.stringify(err)
			});
		}
		else {
			//console.log(user);
			user = req.user;
			if(user===undefined){
				console.log('no user has currently logged in');
				res.send(400, {	'status': 'error',
								'message': 'Error updating user ',
								'info': ''
						});
			}
			else{
				var token = keygen._();
				var validation_link = "http://twyst.in/merchant/#/validate/email/" + token;
				Account.findOneAndUpdate(
							{username: user.username}, 
							{$set: {'validated.email_validated.token': token} }, 
							{upsert:true},
							function(err,user) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating user ' + req.params.user_id,
												'info': JSON.stringify(err)
									});
									console.log(err);
								} 
								else {
									res.send(200, {'status': 'success',
													'message': 'Successfully generated account validation token',
													'info': JSON.stringify(user)
									});

									var message = {
											   	text:    "validation email", 
											   	from:    "Admin <jayram@twyst.in>", 
											   	to:      'Hey'+' '+'<'+	user.email +'>',
											   	subject: "Account validation email",
											   	attachment: 
											   		[{data: 'Click here to validate your account <a href="' + validation_link+'">ResetLink</a>', alternative:true}]
									};
									// send the message and get a callback with an error or details of the message that was sent
									server.send(message, function(err, message) { 
										if(err){
											var m = {
											   	text:    "error sending email", 
											   	from:    "Admin <jayram@twyst.in>", 
											   	to:      'Hey'+' '+'<'+	'jayram@twyst.in' +'>',
											   	subject: "unable to send email to "+user.email,
											};
											server.send(m, function(err, message){console.log(err||message);});
										}
										else{
											console.log('sent an email to you');
											console.log(message);
										}

									 });
		
								}
							});
			}

		}
	});
}

module.exports.forgot = function(req, res) {
			var token = keygen._();
			var reset_link = "http://twyst.in/merchant/#/auth/reset/" + token;
			Account.findOneAndUpdate(
							{username: req.params.username}, 
							{$set: {reset_password_token: token} }, 
							{upsert:true},
							function(err,user) {
								if (err) {
									res.send(400, {	'status': 'error',
												'message': 'Error updating user ' + req.params.user_id,
												'info': JSON.stringify(err)
									});
								} 
								else {
									res.send(200, {'status': 'success',
													'message': 'Successfully generated token',
													'info': JSON.stringify(user)
									});

									var message = {
											   	text:    "forgot password email", 
											   	from:    "Admin <jayram@twyst.in>", 
											   	to:      'Hey'+' '+'<'+	user.email +'>',
											   	subject: "Reset password test",
											   	attachment: 
											   		[{data: 'Click here to validate your account <a href="' + reset_link+'">ResetLink</a>', alternative:true}]
									}
									// send the message and get a callback with an error or details of the message that was sent
									server.send(message, function(err, message) { console.log(err || message); });
		
								}
			});
}

module.exports.reset = function(req, res) {
	var password = req.body.password;
	crypto.randomBytes(32, function(err, buf) {
            if (err) {
                res.send(400, {'status': 'error','info': JSON.stringify(err)});
            }
            console.log(err);

            var salt = buf.toString('hex');

            crypto.pbkdf2(password, salt, 25000, 512, function(err, hashRaw) {
                if (err) {
                     res.send(400, {'status': 'error','info': JSON.stringify(err)});
                }

                self.set('hash', new Buffer(hashRaw, 'binary').toString('hex'));
                self.set('salt', salt);

				console.log(self);                
            });
    });

		
}

module.exports.remember = function(req, res) {
	Account.findOneAndUpdate( 	{username: req.params.username},
							 	{$set: {secret: req.body.secret}},
								{upsert: false}, 
								function(err, user) {
									if(err) {
										res.send(400, {'status': 'error',
														'message': 'Error in remember',
														'info': JSON.stringify(err)
										});
									} else {
										res.send(200, {'status': 'success',
														'message': 'Remember set for user',
														'info': JSON.stringify(user)
										});
									}
								});
}

module.exports.feedbackEmail = function(req,res){
	var feedback = {};
	feedback.message = req.body.feedbackMessage;
	feedback.user = req.user.username;
	var message = {
        text:     JSON.stringify(feedback),
        from:    "Admin <jayram@twyst.in>",
        to:      '<ar@twyst.in>,<jayram@twyst.in>',
        subject: "Feedback from Twyst User"
	};
	server.send(message, function(err, message) {
        res.send(200, {
            'status': 'success',
            'message': 'Feedback Acknowledged',
            'info': 'Feedback Acknowledged'
        });
    });
};