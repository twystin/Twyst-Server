/*jslint node: true */
'use strict';

var mongoose = require("mongoose"),
  async = require('async'),
  _ = require("underscore"),
  CommonUtils = require('../../common/utilities');
require('../../models/event.mdl');
require('../../models/deal.mdl');
var Event = mongoose.model('Event');
var Deal = mongoose.model('Deal');

module.exports.registerEvent = function(req,res) {
  var created_event = {};
	created_event = _.extend(created_event, req.body);
	var event = new Event(created_event);

  // Find the deals that match the event & outlet or the Twyst deals if no event.
  Deal
  .find({'rule.event_type':event.event_type})
  .elemMatch('outlets', {$eq: event.event_outlet})
  .exec(function(err, deals) {
    if (err) {
      // Error getting info from teh server
    } else {
      console.log(deals);
      if (deals) {
        var event_handler = require('./event_handlers/' + created_event.event_type);
        event_handler.handleEvent(created_event, deals);
      } else {
        // No deals were found
      }
    }
  });

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
