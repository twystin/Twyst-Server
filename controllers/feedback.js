var mongoose = require('mongoose');
var Feedback = mongoose.model('Feedback');

module.exports.create = function(req, res){
	
	var feedbackObj = {};
	feedbackObj.account = req.user._id;
	feedbackObj.outlet = req.body.outlet_id;
	feedbackObj.feedback = req.body.feedback;
	feedbackObj = new Feedback(feedbackObj);

	feedbackObj.save(function (err){
		if (err){
			res.send(400, {'status': 'error',
							'message': 'Error occured while recording feedback',
							'info': err
				})
		}
		else{
			res.send(200, {	'status': 'success',
							'message': 'Your feedback has been recorded',
							'info': feedbackObj.feedback
				})
		}
	});
}