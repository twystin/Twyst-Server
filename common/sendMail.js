var path = require('path');
var email = require("../node_modules/emailjs/email");
var nodemailer = require('nodemailer');
var templatesDir = path.resolve(__dirname, '..', 'templates');
var emailTemplates = require('email-templates');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'jayram@twyst.in',
        pass: 'Singh@005'
    }
});


module.exports.sendEmail = function(to, message) {
    var msg = '';
    for (var key in message) {
        if (message.hasOwnProperty(key)) {
            msg += key + " -> " + message[key] + " | ";
        }
    }

    var mailOptions = {
        from: 'Jayram Singh <jayram@twyst.in>', // sender address
        to: to, // list of receivers
        subject: 'Contact us email', // Subject line
        text: 'Contact us email.', // plaintext body
        html: msg
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
};

module.exports.mailer = function(to, msg, sbj) {
    var mailOptions = {
        from: 'Jayram Singh <jayram@twyst.in>', // sender address
        to: to, // list of receivers
        subject: sbj, // Subject line
        text: sbj, // plaintext body
        html: msg
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
};

module.exports.optionMailer = function(mailOptions) {
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    })
}

module.exports.templateMailer = function(templateName, locals) {
    emailTemplates(templatesDir, function(err, template) {
        if (err) {
            console.log(err);
        }
        template(templateName, locals, function(err, html, text) {
            if (err) {
                console.log(err);
            }

            transporter.sendMail({
                from: locals.from,
               to: locals.to,
               cc: locals.cc || null,
               subject: locals.subject ||  null,
               html: html,
               // generateTextFromHTML: true,
               text: locals.text || null
            }, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            })
        });
    });
}