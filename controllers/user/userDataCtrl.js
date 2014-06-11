var http = require('http');

var RecoCtrl = require('../../controllers/recommendations/reccoV2custom');
var OutletCtrl = require('../../controllers/outlet');

var data = {};

data.RECCO = {};
data.NEAR = {};
data.CHECKINS = {};
data.VOUCHERS = {};
data.FAVOURITES = {};

module.exports.getData = function (req, res) {

	getReccos();

	function getReccos() {

		RecoCtrl.considerationSet(req, function (obj) {
			data.RECCO = obj;
			if(data.RECCO.info && (typeof data.RECCO.info) == 'string') {
		    	data.RECCO.info = JSON.parse(data.RECCO.info);
		    }
		    getNearby();
		});
	}

	function getNearby () {
		
		RecoCtrl.nearBy(req, function (obj) {
			data.NEAR = obj;
			if(data.NEAR.info && (typeof data.NEAR.info) == 'string') {
		    	data.NEAR.info = JSON.parse(data.NEAR.info);
		    }
		    getCheckins();
		});
	}

	function getCheckins () {
		
		RecoCtrl.myCheckins(req, function (obj) {
			data.CHECKINS = obj;
			if(data.CHECKINS.info && (typeof data.CHECKINS.info) == 'string') {
		    	data.CHECKINS.info = JSON.parse(data.CHECKINS.info);
		    }
		    getVouchers();
		});
	}

	function getVouchers () {
		
		RecoCtrl.myVouchers(req, function (obj) {
			data.VOUCHERS = obj;
			if(data.VOUCHERS.info && (typeof data.VOUCHERS.info) == 'string') {
		    	data.VOUCHERS.info = JSON.parse(data.VOUCHERS.info);
		    }
		    getFavourites();
		});
	}

	function getFavourites () {
		
		RecoCtrl.myFavourites(req, function (obj) {
			data.FAVOURITES = obj;
			if(data.FAVOURITES.info && (typeof data.FAVOURITES.info) == 'string') {
		    	data.FAVOURITES.info = JSON.parse(data.FAVOURITES.info);
		    }
		    res.send(200, {
		    	'status': "success",
		    	'message': 'Got data successfully',
		    	'info': data
		    })
		});
	}	
}