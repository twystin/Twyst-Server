'use strict';
var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Program = mongoose.model('Program');
var Tier = mongoose.model('Tier');
var Offer = mongoose.model('Offer');
var Outlet = mongoose.model('Outlet');
var _ = require('underscore');
var objCnt = 0;
var arr = [];
module.exports.pushNotification = function(req,res) {
	Account.find({},function(err,users){
		if(err)
		{
			res.send(400, {'status': 'error',
						'message': 'Error fetching accounts',
						'info': JSON.stringify(err)
			});
		}
		else
		{
			var cnt = users.length;
			if(!cnt)
			{
				res.send(400, {
					'status': 'error',
					'message': 'No users',
					'info': JSON.stringify(err)
				});
			}
			users.forEach(function(user){
				var ob = {}; 
				if(!user.home){
					console.log("no home");
				}
				ob.user={
					name: user.username,
					home: user.home
				};
				arr.push(ob);
				cnt--;
				if(cnt===0)
				{
					objCnt = arr.length;
					arr.forEach(function(object){
						var currentLoc = object.user.home;
						var latitude = currentLoc.latitude;
						var longitude = currentLoc.longitude;
						var radius =  6371.0008; // Earth radius
						//, $maxDistance: 0.01
						//Outlet.geoNear([Number(longitude), Number(latitude)], {num: 5,distanceMultiplier: 6371 }, function(err, outlets) {
						Outlet.find({'contact.location.coords': { $nearSphere: [longitude, latitude]}}, {}, {skip: 0, limit:1}, function(err, outlets) {
							if (err) {
								/*res.send(400, {
									'status': 'error',
									'message': 'Error fetching outlets',
									'info': JSON.stringify(err)
								});*/
								objCnt--;
								console.log("no outlets nearby");
								object.offer = {};
								if(objCnt===0)
								{
									res.send(200,{
											'status':'success',
											'message':'Succeeded',
											'info':JSON.stringify(arr)
										});
								}
							} 
							else {
								
								var ourOutlet = outlets[0];
								Program.find({outlets: ourOutlet._id}, function (err, programs) {
									if(err) {
										res.send(400, {
											'status': 'error',
											'message': 'Error getting programs',
											'info': JSON.stringify(err)
										});
										arr=[];
									}
									else {
										if(programs.length > 0) {
											object.outlet = {
												name: ourOutlet.basics.name
											}
											var prog = read(programs,res,object);
										}
										else {
											objCnt--;
										}
									}
								})
							}
						 })
					});
				}
							
			})
		}
	})
}


function read(programs,res,object) {

	var errs = [];
	var tiers = [];
	var recommended_programs = [];
	var num_programs = programs.length;
	programs.forEach(function (program) {
		Program.findOne({_id: program.id}).populate('tiers').exec(function (err, dummy_program) {
			if(err) {
				errs.push(err);
			}
			else {
				var num_tiers = dummy_program.tiers.length;
				dummy_program.tiers.forEach(function (tier) {
					Tier.findOne({'basics.name': tier.basics.name}).populate('offers').exec(function (err, tier) {
						num_tiers--;
						if(err) {
							console.log("Error");
						}
						else {
							tiers.push(tier);
							if(num_tiers === 0) {
								dummy_program.tiers = tiers;
								recommended_programs.push(dummy_program);
								num_programs--;
								tiers = [];
								if(num_programs === 0) {
									objCnt--;
									if(recommended_programs[0])
									{
										if(recommended_programs[0].tiers[0])
										{
											if(recommended_programs[0].tiers[0].offers[0])
											{
												object.offer={
													description: recommended_programs[0].tiers[0].offers[0].basics.description	
												};
											}
											else
											{
												object.offer={};
											}
										}
										else
										{
											object.offer = {};
										}
									}
									else
									{
										object.offer = {};
									}
									if(objCnt===0)
									{
										res.send(200,{
											'status':'success',
											'message':'Succeeded',
											'info':JSON.stringify(arr)
										});
										arr = [];
									}
								}
							}
						}
					})
				})
			}
		})
	})
}