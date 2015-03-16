'use strict';
var nodemailer = require('nodemailer');

var cred = {	
	service: 'Gmail',
	username: 'contactus@twyst.in',
	pass: 'Majoni12',
	template: './controllers/mailer/templates/feedback.handlebars',
	subject: 'Testing For Twyst Welcome Email',
	cc: 'contactus@twyst.in',
	from: 'contactus@twyst.in'
	
}

module.exports.sendWelcomeMail = function(email){
	
	validateEmail();
	function validateEmail() {
		var emailSender =  nodemailer.createTransport({
		    service: cred.service,
		    auth: {
		        user: cred.username,
		        pass: cred.pass
		    }
		});	
		sendEmail(emailSender, email);
	}

	
	function sendEmail(emailSender, toEmail) {

		var mailOptions = { 
	        from: cred.from, 
	        to: toEmail, 
	        subject: cred.subject, 
	        text: "Hi how are you", 
	        html: '',
	        cc: cred.cc
	    }

	    emailSender.sendMail(mailOptions, function(error, data){
	        if(error){
	            console.log(error);
	        } else {
	            console.log('Message sent: ' + data.response);
	        }
	    });
	}
};


