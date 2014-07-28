var email   = require("../node_modules/emailjs/email");
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'jayram@twyst.in',
        pass: 'Singh@005'
    }
});


module.exports.sendEmail = function(to, message){
	var msg = '';
	for (var key in message) {
		if (message.hasOwnProperty(key)) {
			msg += key + " -> " + message[key] + " | ";
		}
	}

	var mailOptions = {
        from: 'Jayram Singh ✔ jayram@twyst.in', // sender address
        to: 'jayram.chandan@gmail.com', // list of receivers
        subject: 'Contact us email', // Subject line
        text: 'Contact us email.', // plaintext body
        html: msg
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
};