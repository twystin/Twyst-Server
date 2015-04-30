var fs = require('fs'),
	Handlebars = require('handlebars'),
	nodemailer = require('nodemailer');
	var SMS = require('../../common/smsSender');
var creds = {
	'FEEDBACK': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/feedback.handlebars',
		subject: 'Feedback from Twyst User',
		cc: 'contactus@twyst.in'
	},
	'WELCOME_APP': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/welcome-app.handlebars',
		subject: 'Welcome to Twyst'
	},
	'WELCOME_EXISTING': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/welcome-pre.handlebars',
		subject: 'Welcome to Twyst'
	},
	'CONTACTUS': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/contact.handlebars',
		subject: 'Contact us page (User)'
	},
	'CONTACTUS_MERCHANT': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/contact-merchant.handlebars',
		subject: 'Contact us page (Merchant)'
	},
	'APP_FEEDBACK': {
		service: 'Gmail',
		username: 'contactus@twyst.in',
		pass: 'Twyst2015',
		template: './controllers/mailer/templates/app-feedback.handlebars',
		subject: 'Feedback from App'
	}
}

module.exports.sendEmail = function(email_object){

	var type = email_object.type;
	validateEmailObject();

	function validateEmailObject() {
		if(!type
			|| !email_object.to
			|| !email_object.data) {
			console.log("Email request incomplete ");
			console.log(email_object);
		}
		else  {
			var transporter = nodemailer.createTransport({
			    service: creds[type].service,
			    auth: {
			        user: creds[type].username,
			        pass: creds[type].pass
			    }
			});
			fs.readFile(creds[type].template, 
			'utf8', 
			function (err, data) {
				if(err) {
					console.log(err);
				}
				else {
					email_object.template = Handlebars.compile(data);
					email_object.template = email_object.template(email_object.data);
					sendmail(transporter, email_object);
				}
			})
		}
	}

	function sendmail(transporter, email_object) {

		var mailOptions = { 
	        from: creds[type].username, // sender address
	        to: email_object.to, // list of receivers
	        subject: creds[type].subject, // Subject line
	        text: creds[type].subject, // plaintext body
	        html: email_object.template
	    };

	    if(email_object.photo_url) {
	    	mailOptions.attachments = getAttachment(email_object.photo_url);
	    }

	    if(creds[type].cc) {
	    	mailOptions.cc = creds[type].cc;
	    }

	    transporter.sendMail(mailOptions, function(error, info){
	        if(error){
	            console.log(error);
	        } else {
	        	if(email_object.type == 'WELCOME_APP' && email_object.phone) {
	        		SMS.sendSms(email_object.phone,
    'Welcome to Twyst! We’ve sent you an e-mail verification link to '+email_object.to+ '. Please check your mail to complete verification. If the ID is incorrect, please write to us at support@twyst.in.' , 'WELCOME_MESSAGE', 'TWYSTR', null);
	        	}
	            console.log('Message sent: ' + info.response);
	        }
	    });
	}

	function getAttachment(photo_url) {
		return [
			{
				filename: 'Feedback photo',
				path: photo_url,
				contentType: 'image/jpeg'
			}
		]
	}
};