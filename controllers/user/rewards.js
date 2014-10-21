var mongoose = require("mongoose");
var Voucher = mongoose.model('Voucher');

module.exports.getRewards = function (req, res) {
	var start = req.query.start || 1,
		end = req.query.end || 20,
		user = req.user;

	Voucher.find({
		'issue_details.issued_to': user._id,
		'basics.created_at': {
			$lt: new Date(Date.now() - 10800000)
		}
	})
	.skip(start - 1)
	.limit(end - start + 1)
	.populate('issue_details.issued_at')
	.exec(function (err, vouchers) {
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting vouchers',
				'info': vouchers
			})
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Got vouchers successfully',
				'info': vouchers
			})
		}
	})
}