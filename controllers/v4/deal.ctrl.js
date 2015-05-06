/*jslint node: true */
'use strict';

var mongoose = require("mongoose"),
  async = require('async'),
  _ = require("underscore"),
  CommonUtils = require('../../common/utilities');
require('../../models/deal.mdl');
var Deal = mongoose.model('Deal');

module.exports.saveDeal = function(req,res) {
  var created_deal = {};
	created_deal = _.extend(created_deal, req.body);
	var deal = new Deal(created_deal);

	deal.save(function(err) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Deal creation error. Please fill all required fields',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Saved deal',
						'info': ''
			});
		}
	});
};
