var mongoose = require("mongoose");
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Voucher = mongoose.model('Voucher');
var async = require('async');
var CommonUtils = require('../../common/utilities');

module.exports.getRecco = function (req, res) {
	var lat = req.query.lat,
		lon = req.query.lon,
		start = req.query.start || 1,
		end = req.query.end || 20;

	getOutlets({}, function (outlets) {
		getProgramsForOutlets(outlets, function (objects) {
			res.send(objects);
		});
	})
}

function getProgramsForOutlets(outlets, callback) {
	var length = outlets.length;
	if(!length) {
		callback([]);
	}
	getPrograms(outlets, function (programs) {
		callback(buildDataObject(outlets, programs));
	})
}

function buildDataObject(outlets, programs) {
	var objects = [];
	outlets.forEach(function (o) {
		var obj = {};
		obj.outlet_summary = o;
		obj.program_summary = getMatchedProgram(programs, o._id);
		objects.push(obj);
	});
	return objects;
}

function getMatchedProgram(programs, outlet_id) {
	if(!programs.length) return null;
	for(var i = 0; i < programs.length; i++) {
		if(programs[i].outlets && programs[i].outlets.length > 0) {
			for(var j = 0; j < programs[i].outlets.length; j++) {
				if(outlet_id.equals(programs[i].outlets[j])) {
					return programs[i];
				}
			}
		}
	}
	return null;
}

function getPrograms(outlets, callback) {
	Program.find({
		'status': 'active',
		'outlets': {
			$in: outlets.map(function (obj){
				return obj._id;
			})
		}
	}, function (err, programs) {
		callback(programs)
	})
}

function getOutlets (q, callback) {
	Outlet.find({
		
	}).
	select({
		'basics.name':1, 
		'contact.location': 1
	}).exec(function (err, outlets) {
		callback(outlets || []);
	})
}