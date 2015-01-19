var Mailer = require('./mailer/mailer');

module.exports.feedbackEmail = function(req, res){

	if(req.body.feedbackMessage) {
		var obj = {
			to: 'contactus@twyst.in',
			data: {
				message: req.body.feedbackMessage,
				user_phone: req.user.phone
			},
			type: 'APP_FEEDBACK'
		};
		Mailer.sendEmail(obj);
		res.send(200, {
			'status': 'success',
			'message': 'Thanks for your feedback',
			'info': 'Thanks for your feedback'
		})
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Error in feedback',
			'info': 'Error in feedback'
		})
	}
};