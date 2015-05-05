/*jslint node: true */
'use strict';

var mongoose = require("mongoose"),
  async = require('async'),
  _ = require("underscore"),
  CommonUtils = require('../../common/utilities');
require('../../models/event.mdl');
var Event = mongoose.model('Event');

module.exports.registerEvent = function(req,res) {
  var created_event = {};
	created_event = _.extend(created_event, req.body);
	var event = new Event(created_event);

  var event_handler = require('./event_handlers/' + created_event.event_type);
  event_handler.handleEvent(created_event);

	event.save(function(err) {
		if (err) {
			res.send(400, {	'status': 'error',
						'message': 'Event creation error. Please fill all required fields',
						'info': JSON.stringify(err)
			});
		} else {
			res.send(200, {	'status': 'success',
						'message': 'Saved event',
						'info': ''
			});
		}
	});
};
