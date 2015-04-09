'use strict';
var nodemailer = require('nodemailer');
var fs = require('fs');
var Handlebars = require('handlebars');

var creds = {
  'APP_UPGRADE': {
    service: 'Gmail',
    username: 'contactus@twyst.in',
    pass: 'Twyst2015',
    template: './controllers/mailer/templates/appupgrade.handlebars',
    subject: 'Welcome to Twyst',
    cc: 'contactus@twyst.in'
  },
  'WELCOME_MAILER': {
    service: 'Gmail',
    username: 'contactus@twyst.in',
    pass: 'Twyst2015',
    template: './controllers/mailer/templates/welcome_mailer.handlebars',
    subject: 'Welcome to Twyst'
  },
  
}

module.exports.sendWelcomeMail = function(email_object){

  var type = email_object.type;
  validateEmailObject();

  function validateEmailObject() {
    if(!type
      || !email_object.email
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
          from: creds[type].username, 
          to: email_object.email, 
          subject: creds[type].subject, 
          text: creds[type].subject, 
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
