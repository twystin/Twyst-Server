var mongoose = require('mongoose');

var Outlet = mongoose.model('Outlet'),
	Reward = mongoose.model('Reward');

var _ = require('underscore'),
	M = require('mstring');

module.exports.render = function (req, res) {
	console.log(req.params.outletUrl)
	if(!req.params.outletUrl) {
		res.send(400);
	}
	Outlet.findOne({
		publicUrl: req.params.outletUrl,
		'outlet_meta.status': 'active'
	}, function (err, outlet) {
		if(err || !outlet) {
			res.send(400);
		}
		else {
			servePage(outlet, function (err, data) {
				if(err) {
					res.send(400);
				}
				else {
					res.send(data);
				}
			});
		}
	})

	function servePage(outlet, cb) {
		if(!outlet) {
			cb(true, null);
		}
		else {
			getReward(outlet, function (err, reward) {
				var data = '';
				data += getHead();
				data += getMeta(outlet, reward);
				data += getCss();
				data += getController(outlet.publicUrl[0]);
				data += getScripts();
				cb(null, data);
			})
		}
	}
}

function getReward(outlet, cb) {
	Reward.findOne({
		outlets: outlet,
		status: 'active'
	}, function (err, reward) {
		cb(err, reward);
	})
}

function getController(url) {
	return "<div ng-view ng-controller='OutletCtrl' ng-init=" + '"' + "getOutlet('" + url + "')" +'"'+"></div>";
}

function getMeta(outlet, reward) {
	var data = '';
	data += "<title>" + outlet.basics.name + ', ' + (outlet.contact.location.locality_1[0] ? outlet.contact.location.locality_1[0] + ", " : ' ') + (outlet.contact.location.locality_2[0] ? outlet.contact.location.locality_2[0] + ", " : ' ') + outlet.contact.location.city +" - Twyst</title>";
	data += '<meta charset="utf-8">';
	data += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
	data += '<meta name="description" content="Unlock exclusive rewards for being a regular! ' + getRewardText(reward) + '">';
	data += '<meta name="keywords" content="Gurgaon restaurant rewards, Delhi restaurant rewards, Noida restaurant rewards, loyality, offers, deals, check-in, twyst rewards, restaurant vouchers, check-in vouchers." />';
	data += '<meta name="author" content="Twyst Technologies Pvt. Ltd.">';
	data += '<meta property="og:site_name" content="'+ outlet.basics.name +' on Twyst"/>'
	data += '<meta property="og:title" content="' + outlet.basics.name + ', ' + outlet.contact.location.locality_1[0] + ' - Twyst" />';
	// data += '<meta property="og:url" content="http://twyst.in/'+ outlet.shortUrl[0] +'" />';
	data += '<meta property="og:description" content="Unlock exclusive rewards for being a regular! Check in on Twyst every time you visit us or order." />';
	data += '<meta property="og:image" content="https://s3-us-west-2.amazonaws.com/twyst-outlets/' + outlet._id + '/logo_gray" />';
	data += '<meta name="apple-itunes-app" content="app-id=907877732, affiliate-data=myAffiliateData, app-argument=myURL">';
	return data;
}

function getRewardText(reward) {
	if(!reward || !reward.rewards) {
		return '';
	}
	var reward_text = '';
	for(var i = 1; i < reward.rewards.length; i++) {
		reward_text += reward.rewards[i].reward + ' on Check-in #' + reward.rewards[i].count + ', ';
	}
	return reward_text;
}

function getCss() {
	return M(function(){
		/***
		<!-- CSS Global Compulsory-->
		<link rel="stylesheet" type="text/css" href="/outlets/assets/css/styles/custom.css">
		<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/css/bootstrap.min.css">
		<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/bootstrap-social/4.2.1/bootstrap-social.min.css">
		<link rel="stylesheet" href="/home/assets/css/style.css">
		<link rel="stylesheet" href="/home/assets/css/headers/header1.css">
		<link rel="stylesheet" href="/home/assets/css/responsive.css">
		<link rel="icon" href="/common/images/favicon/twyst.ico">   
		<link rel="stylesheet" type="text/css" href="/outlets/assets/css/styles/page_job_inner1.css"> 
		<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.1.0/css/font-awesome.min.css">    
		<!-- CSS Implementing Plugins -->    
		<!-- CSS Page Style -->    
		<link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.3.6/slick.css"/>
		<link rel="stylesheet" href="/home/assets/css/pages/page_contact.css">
		<!-- CSS Theme -->    
		<link rel="stylesheet" href="/home/assets/css/themes/default.css" id="style_color">

		<!-- CSS Global Compulsory -->
		<link rel="stylesheet" href="/outlets/assets/plugins/bootstrap/css/bootstrap.min.css">
		<link rel="stylesheet" href="/outlets/assets/css/style.css">

		<!-- CSS Implementing Plugins -->
		<link rel="stylesheet" href="/outlets/assets/plugins/line-icons/line-icons.css">
		<!-- <link rel="stylesheet" href="assets/plugins/font-awesome/css/font-awesome.min.css">   -->  
		<link rel="stylesheet" href="/outlets/assets/plugins/pace/pace-flash.css">  
		<link rel="stylesheet" href="/outlets/assets/plugins/revolution-slider/examples-sources/rs-plugin/css/settings.css" type="text/css" media="screen">
		<!-- load css for cubeportfolio -->
		<link rel="stylesheet" type="text/css" href="/outlets/assets/plugins/cbp-plugin/cubeportfolio/css/cubeportfolio.min.css">

		<!-- load main css for this page -->
		<link rel="stylesheet" type="text/css" href="/outlets/assets/plugins/cbp-plugin/templates/lightbox-gallery/css/main.css">
		<link rel="stylesheet" type="text/css" href="/outlets/assets/css/styles/feature_timeline2.css">

		<!-- CSS Customization -->
		<link rel="stylesheet" href="/outlets/assets/css/custom.css">
		<!-- scripts -->
		<div id="fb-root"></div>

		<style type="text/css">
		.navbar-default .navbar-nav > li > a:before, .top-nav-collapse .navbar-brand, .top-nav-collapse .navbar-nav > li > a, .top-nav-collapse.navbar-default .navbar-nav > li > a:before{
		  color: #000;
		}

		</style>  

		</head> 

		<body id="body" data-spy="scroll" data-target=".navbar-fixed-top" class="demo-lightbox-gallery">

		<!--=== Top ===-->    
		<div class="top">
		<div class="container">         
		  <ul class="loginbar pull-right">
		  </ul>
		</div>      
		</div><!--/top-->
		<!--=== End Top ===-->   

		<!--=== Header ===-->    
		<div class="header">
		<div class="navbar navbar-default navbar-fixed-top" role="navigation">
		  <div class="container">
		    <!-- Brand and toggle get grouped for better mobile display -->
		    <div class="navbar-header page-scroll">
		      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
		        <span class="sr-only">Toggle navigation</span>
		        <span class="icon-bar"></span>
		        <span class="icon-bar"></span>
		        <span class="icon-bar"></span>
		      </button>
		      <a class="navbar-brand" href="index.html">
		        <img id="logo-header" src="/home/assets/img/twyst_logo_2.png" alt="Logo" height="50px" width="auto">                
		      </a>
		    </div>


		    <!-- Collect the nav links, forms, and other content for toggling -->

		    <ul class="nav navbar-nav navbar-right navbar-collapse collapse" id="header_sprite_badges_right_margin">
		      <li style="margin-top: -0.6em" class="hidden-xs hidden-sm">
		        <span style="height: 45px; width: 290px;" class="header_badges_sprite">
		          <a href="https://play.google.com/store/apps/details?id=com.twyst.app.android" class="android_button"></a>
		          <a href="https://itunes.apple.com/in/app/twyst.in/id907877732?mt=8&uo=4" target="itunes_store" class="ios_button"></a>
		        </span>
		      </li>
		      <li> 
		        <a href="/home">
		          Home
		        </a>
		      </li>
		      <li>
		        <a href="/home/#how">
		          How it works
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
		      </div><!-- /input-group -->
		    </div>                
		  </div><!-- /navbar-collapse -->
		</div>    
		</div>    

		</div><!--/header-->
		<!--=== End Header ===-->
		***/
	});
}

function getScripts() {
	return M(function(){
		/***
		<!--=== Copyright ===-->
		<div class="copyright row">
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
		          <img id="logo-footer" src="/home/assets/img/twyst_logo_2.png" class="pull-right" height="39px" width="110px" alt="" />
		        </a>
		      </div>
		    </div><!--/row-->
		  </div><!--/container--> 
		</div><!--/copyright--> 
		<!--=== End Copyright ===-->

		<!-- JS Global Compulsory --> 
		<script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular.min.js"></script>

		<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
		<script type="text/javascript" src="/outlets/assets/plugins/jquery-migrate-1.2.1.min.js"></script>    
		<script type="text/javascript" src="/outlets/assets/plugins/bootstrap/js/bootstrap.min.js"></script>
		<!-- JS Implementing Plugins -->
		<script type="text/javascript" src="/outlets/assets/plugins/jquery.easing.min.js"></script>
		<script type="text/javascript" src="/outlets/assets/plugins/pace/pace.min.js"></script>
		<script type="text/javascript" src="/outlets/assets/plugins/jquery.parallax.js"></script>
		<script type="text/javascript" src="/outlets/assets/plugins/counter/waypoints.min.js"></script>
		<script type="text/javascript" src="/outlets/assets/plugins/counter/jquery.counterup.min.js"></script>       

		<!-- JS Page Level -->  
		<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-route.min.js"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/angular.js/1.2.20/angular-cookies.min.js"></script>
		<script src="//maps.googleapis.com/maps/api/js?sensor=false"></script> 
		<script src="//angulargm.herokuapp.com/angular-gm-0.2.0.min.js"></script>
		<!-- Angular Bootstrap CDN 0.10.0 -->
		<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap-tpls.min.js"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.2/html5shiv.min.js"></script>
		<script src='http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js'></script>
		<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.2.0/js/tooltip.min.js"></script>
		<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/ng-dialog/0.2.14/js/ngDialog.min.js"></script>


		<script type="text/javascript">
		  jQuery(document).ready(function() {
		    App.init();
		    App.initCounter();
		    App.initParallaxBg();
		    $(".fa-cog").tooltip({placement : 'top'});
		  });
		</script>
		<script type="text/javascript" src="/outlets/assets/js/app.js"></script>


		<script type="text/javascript">
		  paceOptions = {
		          // Disable the 'elements' source
		          elements: false,

		          // Only show the progress on regular and ajax-y page navigation,
		          // not every request
		          restartOnRequestAfter: false
		        }
		      </script>
		      <!-- -->
		      
		      <script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.3.6/slick.min.js"></script>
		      <script type="text/javascript" src="/outlets/slick/slick.js"></script>
		      <script type="text/javascript" src="/outlets/state/login/angular-flash.js"></script>
		      <script type="text/javascript" src="/outlets/app.js" ></script> 
		      <script type="text/javascript" src="/outlets/slick/slickslider.js"></script>

		      <script type="text/javascript" src="/outlets/state/discover/twyst.data.svc.js"></script>
		      <script type="text/javascript" src="/outlets/state/discover/discoverCtrl.js"></script>
		      <script type="text/javascript" src="/outlets/state/nearby/nearbyCtrl.js"></script>
		      <script type="text/javascript" src="/outlets/state/login/loginCtrl.js"></script>
		      <script type="text/javascript" src="/outlets/state/login/loginSvc.js"></script>
		      <script type="text/javascript" src="/outlets/state/outlet_view/directive.js"></script>
		      <!-- <script type="text/javascript" src="scripts/angular-ui-router.min.js"></script> -->
		      <!-- <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=onGoogleReady"></script> -->
		      <script>
		        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		        ga('create', 'UA-51763503-1', 'twyst.in');
		        ga('send', 'pageview');

		      </script>
		      <script src="http://pc035860.github.io/angular-easyfb/angular-easyfb.min.js"></script>


		    </body>
		    </html> 
		  ***/
	});
}

function getHead() {
	return M(function(){
		/***
		<!DOCTYPE html>
		<html ng-app="outletApp"> 
			<head>
		***/
	});
}