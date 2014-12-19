var fs = require('fs'),
	Handlebars = require('handlebars'),
	nodemailer = require('nodemailer');

module.exports.sendEmail = function(email_object){

	validateEmailObject();

	function validateEmailObject() {
		if(!email_object.username
			|| !email_object.pass
			|| !email_object.template_name
			|| !email_object.service
			|| !email_object.from
			|| !email_object.to 
			|| !email_object.subject 
			|| !email_object.data) {
			console.log("Email request incomplete " + email_object);
		}
		else  {
			var transporter = nodemailer.createTransport({
			    service: email_object.service,
			    auth: {
			        user: email_object.username,
			        pass: email_object.pass
			    }
			});
			fs.readFile('../'+email_object.template_name, 
			'utf8', 
			function (err, data) {
				if(err) {
					console.log(err);
				}
				else {
					email_object.template = Handlebars.compile(data);
					email_object.template = template(email_object.template);
					sendmail(transporter, email_object);
				}
			})
		}
	}

	function sendmail(transporter, email_object) {

		var mailOptions = { 
	        from: email_object.from, // sender address
	        to: email_object.to, // list of receivers
	        subject: email_object.subject, // Subject line
	        text: email_object.subject, // plaintext body
	        html: template
	    };
	}
	

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
};