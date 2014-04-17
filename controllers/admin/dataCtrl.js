var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Account = mongoose.model('Account');

module.exports.getOutlets = function (req, res) {

	var cities = req.params.cities || [];
	var merchant = req.params.merchant;
	
	if(merchant && cities.length > 0) {
		cities = cities.split(',');
		find();
	}
	else {
		res.send(400, {
			'status': 'error',
			'message': 'Error getting outlets.',
			'info': ''
		});
	}

	function find() {
		Outlet.find({
			'outlet_meta.accounts': merchant,
			'contact.location.city': {
				$in: cities
			}}).select({'basics.name':1, 'contact.location.locality_1': 1}).exec(function (err, outlets) {
			
			if(err) {
				res.send(400, {
					'status': 'error',
					'message': 'Error getting outlets.',
					'info': JSON.stringify(err)
				});
			}
			else {
				res.send(200, {
					'status': 'success',
					'message': 'Successfully got outlets.',
					'info': outlets
				});
			}
		})
	}
}

module.exports.getMerchants = function (req, res) {

	Account.find({
		'role': 3 
		}).select({'username':1}).exec(function (err, merchants) {
		
		if(err) {
			res.send(400, {
				'status': 'error',
				'message': 'Error getting merchants.',
				'info': JSON.stringify(err)
			});
		}
		else {
			res.send(200, {
				'status': 'success',
				'message': 'Successfully got merchants.',
				'info': merchants
			});
		}
	})
}

module.exports.getData = function (req, res) {
	var range = req.body.range;
	var outlets = req.body.range;


}