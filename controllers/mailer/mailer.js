var fs = require('fs'),
	Handlebars = require('handlebars'),
	nodemailer = require('nodemailer');
var creds = {
	'FEEDBACK': {
		service: 'Gmail',
		username: 'jayram@twyst.in',
		pass: 'Singh@005',
		template: './controllers/mailer/templates/feedback.handlebars',
		subject: 'Feedback from Twyst User',
		cc: 'contactus@twyst.in'
	},
	'WELCOME_APP': {
		service: 'Gmail',
		username: 'jayram@twyst.in',
		pass: 'Singh@005',
		template: './controllers/mailer/templates/welcome-app.handlebars',
		subject: 'Welcome to Twyst'
	},
	'WELCOME_EXISTING': {
		service: 'Gmail',
		username: 'jayram@twyst.in',
		pass: 'Singh@005',
		template: './controllers/mailer/templates/welcome-pre.handlebars',
		subject: 'Welcome to Twyst'
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