var email   = require("../node_modules/emailjs/email");
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'jayram@twyst.in',
        pass: 'Singh@005'
    }
});


function sendEmail(message){

	var mailOptions = {
        from: 'Jayram Singh <jayram@twyst.in>', // sender address
        to: 'jayram.chandan@gmail.com', // list of receivers
        subject: 'Test mail', // Subject line
        text: 'Contact us email.', // plaintext body
        html: '<b>I am the boss</b>'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
};

sendEmail();