var mongoose = require('mongoose');
var Notif = mongoose.model('Notif');

module.exports.status = function (req, res) {
	var status = {
		last_run_time: null,
		next_run_time: null
	};

	Notif.findOne({
		status: 'SENT',
		message_type: 'SMS'
	})
	.sort({'sent_at': -1})
	.exec(function (err, notif) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting status',
				'data': err
			})
		}
		else {
			if(!notif) {
				res.send(400, {
					'status': 'error',
					'message': 'No notifs found',
					'data': err
				})
			}
			else {
				status.last_run_time = notif.sent_at;
				status.next_run_time = new Date(new Date(status.last_run_time).getTime() + 3600000);
				res.send(200, {
					'status': 'success',
					'message': 'Got status successfully',
					'info': status
				})
			}
		}
	})
}