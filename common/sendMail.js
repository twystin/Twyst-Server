var email   = require("../node_modules/emailjs/email");

var server  = email.server.connect({
			user:       "jayram@twyst.in", 
			password:   "Singh@005", 
			host:       "smtp.gmail.com", 
			ssl:        true
});


module.exports.sendEmail = function(to, message){
	var m ='';
	m += 'From: ' + message.name || 'NA';
	m += '\nPhone: ' + message.phone || 'NA';
	m += '\nEmail: ' + message.email || 'NA';
	m += '\nMessage: ' + message.message;
	var message = {
        text:     m,
        from:    "Admin <jayram@twyst.in>",
        to:      to,
        subject: "Contact us email"
	};
	server.send(message, function(err, message) {
        console.log(err || message);
    });
};