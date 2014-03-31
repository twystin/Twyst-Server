var mongoose = require('mongoose');
var Tag = mongoose.model('Tag');


module.exports.getTypeaheadTags = function (req, res) {
	console.log(req.params.name);
	Tag.find({name: new RegExp('^'+req.params.name, "i")}, function(err, tags) {
	  //Do your action here..
	  if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting count',
				'info': JSON.stringify(err)
			})
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got tags',
				'info': tags
			})
		}

	});
}