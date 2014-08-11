var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var Program = mongoose.model('Program');
var Checkin = mongoose.model('Checkin');
var Tier = mongoose.model('Tier');
var _ = require('underscore');
var async = require('async');
var CommonUtilities = require('../../common/utilities');
var M = require('mstring');

module.exports.render = function(req,res) {
	var publicUrl = req.url.toString();
	Outlet.findOne({publicUrl: publicUrl}, function (err, outlet) {
		if(err) {
			res.send(400,  {
		    	'status': 'success',
		    	'message': 'Error getting outlet.',
		    	'info': err
		    });
		}
		else {
			if(outlet) {
				getData(outlet._id);
			}
			else {
				res.send(400,  {
			    	'status': 'success',
			    	'message': 'Error getting outlet.',
			    	'info': err
			    });
			}
		}
	});
	
	function getData (outlet_id) {
		console.log(outlet_id)
		async.parallel({
		    OUTLET: function(callback) {
		    	getOutlet(outlet_id, callback);
		    },
		    REWARDS: function(callback) {
		    	getRewards(outlet_id, callback);
		    },
		    UNIQUE: function (callback) {
		    	getUniqueCustomers(outlet_id, callback);
		    }
		}, function(err, results) {
		    renderPage(results);
		});
	}

	function getOutlet (outlet_id, callback) {
		Outlet.findOne({_id: outlet_id}, function(err, outlet) {
			callback (null, outlet || {});
		}); 
	}

	function getUniqueCustomers (outlet_id, callback) {
		Checkin.
			find({outlet: outlet_id}).
			distinct('phone').
			count().exec(function (err, count) {
				callback(null, count || 0);
		});
	}

	function getRewards (outlet_id, callback) {
		Program.findOne({
			outlets: outlet_id,
			'status': 'active'
		}, function(err, program) {

			if(program) {
				populateProgram(program);
			}
			else {
				callback(null, null);
			}
		});

		function populateProgram (program) {
			var tiers = [];
			var count = program.tiers.length;

			program.tiers.forEach(function (id) {
				Tier.findOne({_id: id}).populate('offers').exec(function (err, tier) {
						var t = {};
						t = tier;
						count--;
						tiers.push(t);
						if(count === 0) {
							program = program.toObject();
							program.tiers = tiers;
							callback(null, getOffers(program));
						}
					})
			});
		}
	}

	function getOffers (p) {
	    var rewards = [];
	    var val = -1;

	    var program = p;
	    var obj = {};
	    
	    for(var i = 0; i < program.tiers.length; i++) {
	    	if(program.tiers[i]) {
	    		for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
		            
		            for(var j = 0; j < program.tiers[i].offers.length; j++) {
		                obj = {};
		                if(program.tiers[i].offers[j]) {
		                	if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
			                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
			                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
			                    
			                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
			                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
			                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
			                        obj.count = lim + 1;
			                        obj.desc = CommonUtilities.rewardify(program.tiers[i].offers[j]);
			                        obj.title = program.tiers[i].offers[j].basics.description;
			                        obj.terms = program.tiers[i].offers[j].terms;
			                        rewards.push(obj);
			                    }
			                }
		                }
		            }
		        }	
	    	}
	        
	    }
	    
	    rewards = _.uniq(rewards, function (obj) {
	    	return obj.count;
	    });

	    rewards = _.sortBy(rewards, function (obj) {
	    	return obj.count;
	    });

	    return rewards;
	}

	function renderPage (results) {
		var html = '';
		html += '\n<!doctype html>';
		html += '\n<html ng-app="outletApp">';
		html += '\n\t<head>';
		html += '\n\t<title>'+ results.OUTLET.basics.name + ', ' + 
			results.OUTLET.contact.location.locality_1.toString() + ', ' + 
			results.OUTLET.contact.location.locality_2.toString() + ', ' +
			results.OUTLET.contact.location.city + ' - Twyst</title>';
		html += getHtmlHeadIncludes();
		html += '\n\t</head>';
		html += '\n\t<body>';
		html += '\n\t\t<div class="top">';
		html += '<div class="container">';
		html += '<ul class="loginbar pull-right">';
		html += '</ul>';
		html += '</div>';
		html += '</div>';
		html += getHeader();
		html += getBody();
		html += getFooter();
		html += '\n\t</body>'
		html += '</html>'
		res.send(html);
	}

	function getBody(outlet) {
		return M(function () {
			/***
				<link rel="stylesheet" type="text/css" href="/outlets/styles/page_job_inner1.css">

				<style type="text/css">
				    .center{
				        text-align: center;
				    }
				    .color_black{
				        color: black;        
				    }
				    .merchant_logo{
				        width: 200px;
				        height: auto;	
				    }
				    .bg{
				        background-image: url("/outlets/images/Twyst_blur.jpg");
				        background-repeat: no-repeat;
				        z-index: -9999;
				       
				    }
				    .padding-top{
				        padding-top: 10px;
				    }
				    .padding-top-5{
				        padding-top: 5px;
				    }
				    .header{
				        padding:8px 0px 8px 0px;
				    }
				</style>
				<!--=== Job Description ===-->
				    <div class="job-description">
				    <div class="bg">
				        <div class="container content">
				            <div class="title-box-v2 center">
				                <img class="center merchant_logo" src="/outlets/images/Twyst/cupncake.jpg" alt="">
				                <h2><b class="color_black">{{outlet.basics.name}}<b></h2>
				                <h2><small ><b class="color_black">PHONE: &nbsp;</b><b class="color_black">{{ outlet.contact.phones.landline}}&nbsp;&nbsp;</b><b class="color_black" ng-repeat="mobile in outlet.contact.phones.mobile">{{mobile.num}}&nbsp;&nbsp;</b></small></h2>
				                <p class="color_black"><b class="color_black">ADDRESS:</b>{{outlet.contact.location.address}}</p>

				            </div>    
				            <div class="row">
				                <!-- Left Inner -->
				                <div class="col-md-7">
				                    <div class="left-inner">
				                        <h2><b>Highlights</b></h2>
				                        <div class="row">
				                             <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-cutlery"></i>
				                                    <div class="overflow-h padding-top">
				                                         Dine in <span ng-show="outlet.attributes.dine_in">Available</span>
				                                         <span ng-show="!outlet.attributes.dine_in">Not Available</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->

				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-glass"></i>
				                                    <div class="overflow-h padding-top">
				                                        Alcohol <span ng-show="outlet.attributes.alcohol">Available</span>
				                                         <span ng-show="!outlet.attributes.alcohol">Not Available</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->
				                        </div>
				                        <div class="row">
				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-magic"></i>
				                                    <div class="overflow-h padding-top">
				                                        Smoking Area <span ng-show="outlet.attributes.smoking">Available</span>
				                                         <span ng-show="!outlet.attributes.smoking">Not Available</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->

				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-sitemap"></i>
				                                    <div class="overflow-h padding-top">
				                                        Food Court <span ng-show="outlet.attributes.foodcourt">Available</span>
				                                         <span ng-show="!outlet.attributes.foodcourt">Not Available</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->
				                        </div>
				                        <div class="row">
				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-pagelines"></i>
				                                    <div class="overflow-h padding-top">
				                                        Veg  <span ng-show="outlet.attributes.veg">Available</span>
				                                         <span ng-show="!outlet.attributes.veg">Not Available</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->

				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-truck"></i>
				                                    <div class="overflow-h padding-top">
				                                        Home Delivery <span ng-show="outlet.attributes.home_delivery">Available</span>
				                                         <span ng-show="!outlet.attributes.home_delivery">Not Available</span>
				                                    </div>
				                                </div>
				                            </div>
				                            <!-- End Overview -->
				                        </div>
				                        <div class="row">
				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-chain"></i>
				                                    <div class="overflow-h padding-top">
				                                        Part of a Chain: <span ng-show="outlet.attributes.chain">Yes</span>
				                                         <span ng-show="!outlet.attributes.chain">No</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->

				                            <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-road"></i>
				                                    <div class="overflow-h padding-top">
				                                        Outdoor Seating: <span ng-show="outlet.attributes.outdoor">Yes</span>
				                                         <span ng-show="!outlet.attributes.outdoor">No</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->
				                        </div>
				                        <div class="row">
				                             <!-- Begin Overview -->
				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-asterisk"></i>
				                                    <div class="overflow-h padding-top">
				                                        Air-conditioning: <span ng-show="outlet.attributes.air_conditioning">{{outlet.attributes.air_conditioning}}</span>
				                                    </div>    
				                                </div>
				                            </div>
				                            <!-- End Overview -->

				                             <!-- Begin Overview -->
				                            <div class="col-sm-6" ng-show="outlet.attributes.wifi">
				                                <div class="overview">
				                                    <i class="fa fa-signal"></i>
				                                    <div class="overflow-h padding-top">
				                                        WiFi: <span >{{outlet.attributes.wifi}}</span>
				                                    </div>    
				                                </div>
				                            </div>

				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-tags"></i>
				                                    <div class="overflow-h padding-top">
				                                        Reservation: <span >{{outlet.attributes.reservation}}</span>
				                                    </div>    
				                                </div>
				                            </div>

				                            <div class="col-sm-6">
				                                <div class="overview">
				                                    <i class="fa fa-car"></i>
				                                    <div class="overflow-h padding-top">
				                                        Parking: <span >{{outlet.attributes.parking}}</span>
				                                    </div>    
				                                </div>
				                            </div>
				                      
				                            <!-- End Overview -->

				                        </div>

				                        <hr>

				                        <b>Cuisines:</b> {{outlet.attributes.cuisines.toString()}}
				                        <hr>
				                        <b>Cost For Two: </b><i class="fa fa-inr"> <b>{{getCostForTwoText(outlet)[0]}}</b></i> <b>to</b> <i class="fa fa-inr"> <b>{{getCostForTwoText(outlet)[1]}}</b></i><br><b>Payment options:</b> {{outlet.attributes.payment_options.toString()}}.
				                        <hr>
				                        <b>Opening Hours</b><br>
				                        {{outlet.attributes.timings}}
				                        <hr>
				                        <b>Photos</b>{{outlet.attributes.photos.thumbnail}}
				                        
				                        <hr>
				                        <b>Location: {{outlet.contact.location.locality_1.toString()}}</b><br>

				                        <hr>
				                    </div>
				                </div>

				                <!-- End Left Inner -->
				                
				                <!-- Right Inner -->
				                <div class="col-md-5"> 
				                                     
				                    <div class="right-inner">
				                        <h2 class="panel-title heading-sm pull-left"><i class="fa fa-qrcode"></i><b>Offers by Check-in No</b></h2><br><br>
				                        <div class="people-say margin-bottom-20" ng-repeat="offer in rewards">
				                            <div class="col-md-1">
				                                <p>{{offer.count}}</p>
				                            </div>
				                            <div class="overflow-h col-md-11">
				                                <p>{{offer.title}}</p>
				                            </div>  
				                        </div>

				                        <hr> 
				                        <!-- Pie Chart Progress Bar -->    
				                        <div class="row margin-bottom-20">
				                            <div class="p-chart col-sm-6 col-xs-6 sm-margin-bottom-10">
				                                <h3>Check-ins Last Month</h3>
				                                <div class="circle" id="circle-4"><donut-chart id="d3donut-chart" data="[{name: one,value: 65}, {name: two,value: 15}, {name: three,value: 20}]"></donut-chart></div>
				                                <ul class="list-unstyled overflow-h">
				                                    <li><i> - </i><a ng-href="#">Tips to Improve</a></li>
				                                    <li><i> - </i><a ng-href="#">Compare to Others</a></li>
				                                    <li><i> - </i><a ng-href="#">More Information</a></li>
				                                </ul>
				                            </div> 
				                            <div class="p-chart col-sm-6 col-xs-6">
				                                <h3>Redemptions Last Month</h3>
				                                <div class="circle" id="circle-5"><donut-chart id="d3donut-chart" data="[{name: one,value: 65}, {name: two,value: 15}, {name: three,value: 20}]"></donut-chart></div>
				                                <ul class="list-unstyled overflow-h">
				                                    <li><i> - </i><a ng-href="#">Steps to Completion</a></li>
				                                    <li><i> - </i><a ng-href="#">Compare to Others</a></li>
				                                    <li><i> - </i><a ng-href="#">More Information</a></li>
				                                </ul>    
				                            </div>       
				                        </div>    
				                        <!-- End Pie Chart Progress Bar -->
				                        <hr>
				                        <h3>Recent Events</h3>     
				                        <img ng-src="/outlets/images/cnc.jpg" alt="">
				                        <div class="overflow-h">
				                            <span class="font-s">Predict FIFA World Cup 2014 winner</span>
				                            <p>Predict the winner of FIFA World Cup 2014 and you could win some exciting treats! 3 lucky winners will be eligible to win the following prizes in order of precedence: 1st. Red Velvet Cake, 2nd. Blueberry Cheesecake 3rd. Box of 6 cupcakes! Contest closes 8th July 2014.</p>
				                            <ul class="social-icons">
				                                <li><a class="social_facebook" data-original-title="Facebook" href="#"></a></li>
				                                <li><a class="social_googleplus" data-original-title="Google Plus" href="#"></a></li>
				                                <li><a class="social_tumblr" data-original-title="Tumblr" href="#"></a></li>
				                                <li><a class="social_twitter" data-original-title="Twitter" href="#"></a></li>
				                            </ul>
				                        </div>
				                        <hr>
				                    </div>   
				                </div>
				                <!-- End Right Inner -->
				            </div>    
				        </div>   
				    </div>
				    </div>   
				    <!--=== End Job Description ===-->
			***/
		});
	}

	function getFooter () {
		return M(function () {
			/***
				 <link rel="stylesheet" type="text/css" href="/outlets/styles/style.css">
				 <style type="text/css">
				 .social_twitter {background: url(/home/assets/img/icons/social/twitter.png) no-repeat;}
				 .social_facebook {background: url(/home/assets/img/icons/social/facebook.png) no-repeat;}
				 .social_rss {background: url(/home/assets/img/icons/social/rss.png) no-repeat;}
				 .social_tumblr {background: url(/home/assets/img/icons/social/tumblr.png) no-repeat;}
				 .social_googleplus {background: url(/home/assets/img/icons/social/googleplus.png) no-repeat;}
				 </style>
				 <!--=== Footer ===-->
				    <div class="footer">
				        <div class="container">
				            <div class="row">
				                <div class="col-md-4 md-margin-bottom-40">
				                    <!-- About -->
				                    <div class="headline">
				                        <h2>About</h2>
				                    </div>
				                    <p class="margin-bottom-25 md-margin-bottom-40">Twyst is a start-up based out of Gurgaon, started by Abhimanyu Lal (IIM Ahmedabad, ex-eBay), Rahul Chakraborti (IIM Bangalore, ex-Yahoo!) and Arun Rajappa (Indian School of Business, ex-Microsoft).</p>


				                    <!-- <div class="headline">
				                        <h2>Monthly Newsletter</h2>
				                    </div>
				                    <p>Subscribe to our newsletter and stay up to date with the latest news and deals!</p>
				                    <form class="footer-subsribe">
				                        <div class="input-group">
				                            <input type="text" class="form-control" placeholder="Email Address">
				                            <span class="input-group-btn">
				                            <button class="btn-u" type="button">Subscribe</button>
				                        </span>
				                        </div>
				                    </form> -->
				                </div>
				                <!--/col-md-4-->

				                <div class="col-md-4 md-margin-bottom-40">
				                    <div class="posts">
				                        <div class="headline">
				                            <h2>Recent Blog Entries</h2>
				                        </div>
				                        <dl class="dl-horizontal">
				                            <a href="http://blog.twyst.in/?p=85">
				                                <dt><img src="../../../home/assets/img/rss.png" alt="" /></dt>
				                                <dd>
				                                    <p>Customer Engagement for Everyone
				                                    </p>
				                                </dd>
				                            </a>
				                        </dl>
				                        <dl class="dl-horizontal">
				                            <a href="http://blog.twyst.in/?p=69">
				                                <dt><img src="../../../home/assets/img/rss.png" alt="" /></dt>
				                                <dd>
				                                    <p>The Tech Behind Twyst
				                                    </p>
				                                </dd>
				                            </a>
				                        </dl>
				                        <dl class="dl-horizontal">
				                            <a href="http://blog.twyst.in/?p=55">
				                                <dt><img src="../../../home/assets/img/rss.png" alt="" /></dt>
				                                <dd>
				                                    <p>Ready to Twyst?
				                                    </p>
				                                </dd>
				                            </a>
				                        </dl>
				                    </div>
				                </div>
				                <!--/col-md-4-->

				                <div class="col-md-4">
				                    <!-- Monthly Newsletter -->
				                    <div class="headline">
				                        <h2>Contact Us</h2>
				                    </div>
				                    <address class="md-margin-bottom-40">
				                    #3, Navkriti Arcade, <br />
				                    Sector 55, Guragaon, 122003 <br />
				                    <p><a href="contact.html">Get in touch</a></p>
				                </address>

				                    <!-- Stay Connected -->
				                    <div class="headline">
				                        <h2>Stay Connected</h2>
				                    </div>
				                    <ul class="social-icons">
				                        <li>
				                            <a href="http://blog.twyst.in" data-original-title="Feed" class="social_rss"></a>
				                        </li>
				                        <li>
				                            <a href="https://www.facebook.com/twystin" data-original-title="Facebook" class="social_facebook"></a>
				                        </li>
				                        <li>
				                            <a href="https://twitter.com/twystin" data-original-title="Twitter" class="social_twitter"></a>
				                        </li>
				                    </ul>
				                </div>
				                <!--/col-md-4-->
				            </div>
				            <!--/row-->
				        </div>
				        <!--/container-->
				    </div>
				    <!--/footer-->
				    <!--=== End Footer ===-->

				    <!--=== Copyright ===-->
				    <div class="copyright">
				        <div class="container">
				            <div class="row">
				                <div class="col-md-6">
				                    <p class="copyright-space">
				                        2013 &copy; Twyst Technologies Pvt. Ltd.
				                        <a href="http://twyst.in/legal/Privacy_Policy.pdf">Privacy Policy</a> | <a href="http://twyst.in/legal/terms_of_use.pdf">Terms of Service</a>
				                    </p>
				                </div>
				                <div class="col-md-6">
				                    <a href="index.html">
				                        <img id="logo-footer" src="../../../home/assets/img/twyst_logo_2.png" class="pull-right" height="39px" width="110px" alt="" />
				                    </a>
				                </div>
				            </div>
				            <!--/row-->
				        </div>
				        <!--/container-->
				    </div>
				    <!--/copyright-->
				    <!--=== End Copyright ===-->

			***/
		});
	}

	function getHeader() {
		return M(function () {
			/***
				<link rel="stylesheet" type="text/css" href="/home/assets/css/headers/header1.css">

				<!--=== Header ===-->
				    <div class="header">
				        <div class="navbar navbar-default" role="navigation">
				            <div class="container">
				                <!-- Brand and toggle get grouped for better mobile display -->
				                <div class="navbar-header">
				                    <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-responsive-collapse">
				                        <span class="sr-only">Toggle navigation</span>
				                        <span class="icon-bar"></span>
				                        <span class="icon-bar"></span>
				                        <span class="icon-bar"></span>
				                    </button>
				                    <a class="navbar-brand" href="index.html">
				                        <img id="logo-header" src="../../../home/assets/img/twyst_logo_2.png" alt="Logo" height="50" width="auto" >
				                    </a>
				                </div>

				                <!-- Collect the nav links, forms, and other content for toggling -->
				                <div class="collapse navbar-collapse navbar-responsive-collapse">
				                    <ul class="nav navbar-nav navbar-right">
				                        <li class="dropdown active">
				                            <a href="index.html">
				                            Home
				                        </a>
				                        </li>
				                        <li class="dropdown">
				                            <a href="index.html#how">
				                            How it works
				                        </a> 
				                        </li>
				                        <li>
				                            <a href="about.html">
				                            About us
				                        </a> 
				                        </li>
				                        <li class="dropdown">
				                            <a href="careers.html">
				                            Careers
				              `          </a> 
				                        </li>
				                        <li>
				                            <a href="contact.html">
				                            Contact us
				                        </a>
				                        </li>
				                        <li>
				                            <a href="http://twyst.in/merchant/">
				                            For merchants
				                        </a>
				                        </li>

				                    </ul>
				                    <div class="search-open">
				                        <div class="input-group">
				                            <input type="text" class="form-control" placeholder="Search">
				                            <span class="input-group-btn">
				                            <button class="btn-u" type="button">Go</button>
				                        </span>
				                        </div>
				                        <!-- /input-group -->
				                    </div>
				                </div>
				                <!-- /navbar-collapse -->
				            </div>
				        </div>
				    </div>
				    <!--/header-->
				    <!--=== End Header ===-->
			***/
		})
	}

	function getHtmlHeadIncludes()  {
		return M(function(){
			/***
				<script src="/common/libs/angular/angular.js"></script>
			    <script type="text/javascript" src="/common/libs/angular/angular-route.min.js"></script>
			    <script src="/common/libs/angular-file-upload/angular-file-upload.min.js"></script>
			    <script src="/common/libs/angular/angular-cookies.min.js"></script>
			    <script src="/common/libs/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
			    <script src="/common/libs/html5shiv.js"></script>
			    <script src='/common/libs/underscore/underscore-min.js'></script>
			    <!-- -->
			    <script type="text/javascript" src="/outlets/app.js" ></script>
			    <script type="text/javascript" src="/outlets/donutdirective.js" ></script>
			    <script type="text/javascript" src="/outlets/d3Svc.js" ></script>
			    <script type="text/javascript" src="/outlets/outletCtrl.js" ></script>
			    <script type="text/javascript" src="/outlets/outletSvc.js"></script>

				<!-- Styles -->
				<link rel="stylesheet" href="/home/assets/plugins/bootstrap/css/bootstrap.min.css">
			    <link rel="stylesheet" type="text/css" href="/outlets/styles/style.css">
			    <link rel="stylesheet" type="text/css" href="/outlets/styles/app.css">
			    <link rel="stylesheet" type="text/css" href="/home/assets/css/themes/default.css">     
			    <link rel="stylesheet" type="text/css" href="/outlets/styles/custom.css"> 
			    <link rel="stylesheet" type="text/css" href="/common/libs/font-awesome/css/font-awesome.min.css">
			    <link rel="stylesheet" type="text/css" href="/outlets/styles/page_job_inner1.css">
		  	***/
		});
	}
};