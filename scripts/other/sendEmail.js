var account = require('../../models/account.js');

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var keygen = require("keygenerator");
var EmailAndSmsSender = require('../../controllers/welcome_email_sms');
var Mailer = require('../../controllers/mailer/mailer');
var secret_code = keygen.session_id();
mongoose.connect('mongodb://localhost/twyst');
	var a = 0;
	Account.find({'role': {$in: [6,7]}},{}, {skip: 5, limit: 5}, function(err,	accounts) {
		if (err) {
			console.log(err);
		} 
		else {
			accounts.forEach(function (account) {
			 	
				if(account.role === 7 && account.social_graph !== undefined && account.social_graph.facebook !== undefined) {
					if(account.profile.email && !account.validated.email_validated.is_welcome_mailer_sent)  {
						//Send Welcome Mail if not sent
						console.log('here fb app user')
						console.log('sendWelcomeMail '+ account.profile.email)
						account.validated = account.validated || {};
			            account.validated.email_validated = account.validated.email_validated || {};
			            
			            //account.validated.email_validated.is_welcome_mailer_sent = true;
						var email_object = {
					      email: 'kuldeepp89@gmail.com',
					      data: {
					        link: null
					      },
					      type: 'WELCOME_MAILER',
					      phone: account.phone
					    };
						EmailAndSmsSender.sendWelcomeMail(email_object); 
						a = a +1;
					}
	          	}
	          	else if(account.role === 7 && account.facebook !== undefined ) {
					if(account.profile.email && !account.validated.email_validated.is_welcome_mailer_sent)  {
						//Send Welcome Mail if not sent
						console.log('here fb app user 1')
						console.log('sendWelcomeMail '+ account.profile.email)
						account.validated = account.validated || {};
			            account.validated.email_validated = account.validated.email_validated || {};
			            
			            //account.validated.email_validated.is_welcome_mailer_sent = true;
						var email_object = {
					      email: 'kuldeepp89@gmail.com',
					      data: {
					        link: null
					      },
					      type: 'WELCOME_MAILER',
					      phone: account.phone
					    };
						EmailAndSmsSender.sendWelcomeMail(email_object); 
						a = a +1;
					}
	          	}
	          	else {
	          		//do nothing
	          	}

				if(account.role === 7 && account.facebook === undefined && account.social_graph.facebook === undefined) {
					if(!account.validated.email_validated.status && !account.validated.email_validated.token) {
						if(account.profile.email)  {
							console.log('here non fb app user')
							//send verification mail
							console.log('verification '+ account.profile.email)
							account.validated = account.validated || {};
				            account.validated.email_validated = account.validated.email_validated || {};
				            //account.validated.email_validated.token = secret_code;
				            
							var email_object = {
								to: account.profile.email,
								data: {
									link: null
								},
								type: 'WELCOME_APP',
								phone: account.phone
							};

							email_object.data.link = 'http://twyst.in/verify_email/' +false+'/'+ secret_code;
							Mailer.sendEmail(email_object);
							
							a = a +1;
						}

					}
					else {

					}
	          	}

	          	if(account.role === 7 && account.facebook === undefined && account.social_graph.facebook === undefined) {
					if(account.validated.email_validated.status && !account.validated.email_validated.is_welcome_mailer_sent) {
						if(account.profile.email)  {
							console.log('here verified email user')
							console.log('sendWelcomeMail '+ account.profile.email)
							//send welcome mail
							a=a+1
							account.validated = account.validated || {};
				            account.validated.email_validated = account.validated.email_validated || {};
				       
				            //account.validated.email_validated.is_welcome_mailer_sent = true;
							var email_object = {
						      email: 'kuldeepp89@gmail.com',
						      data: {
						        link: null
						      },
						      type: 'WELCOME_MAILER',
						      phone: account.phone
						    };
							EmailAndSmsSender.sendWelcomeMail(email_object); 
							
						}
					}	
					else {

					}
	          	}

	          	if(account.role === 6 && (account.facebook !== undefined || account.social_graph.facebook !== undefined)) {
					if(account.profile.email && !account.validated.email_validated.is_welcome_mailer_sent) {
						
							console.log('here non verified, app user')
							console.log('WELCOME_MAILER '+ account.profile.email)
							a=a+1
							account.validated = account.validated || {};
				            account.validated.email_validated = account.validated.email_validated || {};
				            //account.validated.email_validated.token = secret_code;
				            //account.validated.email_validated.is_app_upgrade_mailer_sent = true;
				            
				            var email_object = {
						      email: 'kuldeepp89@gmail.com',
						      data: {
						        link: null
						      },
						      type: 'WELCOME_MAILER',
						      phone: account.mobile
						    };

						    

						    EmailAndSmsSender.sendWelcomeMail(email_object);

							//send welcom  mail
						
					}
					else {

					}
	          	}

	          	if(account.role === 6 && account.facebook === undefined && account.social_graph.facebook === undefined) {
					if(!account.validated.email_validated.status && !account.validated.email_validated.is_app_upgrade_mailer_sent) {
						if(account.profile.email)  {
							console.log('here non verified non app user')
							console.log('APP_UPGRADE '+ account.profile.email)
							a=a+1
							account.validated = account.validated || {};
				            account.validated.email_validated = account.validated.email_validated || {};
				            //account.validated.email_validated.token = secret_code;
				            //account.validated.email_validated.is_app_upgrade_mailer_sent = true;
				            
				            var email_object = {
						      email: 'kuldeepp89@gmail.com',
						      data: {
						        link: null
						      },
						      type: 'APP_UPGRADE',
						      phone: account.mobile
						    };

						    email_object.data.link = 'http://twyst.in/verify_email/' + true +'/'+  secret_code ;

						    EmailAndSmsSender.sendWelcomeMail(email_object);

							//send app upgrade mailer mail
						}
					}
					else {

					}
	          	}

				if(account.role === 6 && account.facebook === undefined && account.social_graph.facebook === undefined) {
					if(account.validated.email_validated.status && !account.validated.email_validated.is_welcome_mailer_sent) {
						if(account.profile.email)  {
							console.log('here verified app user')
							console.log('sendWelcomeMail '+ account.profile.email)
							//send welcome  mail
							a=a+1
							account.validated = account.validated || {};
				            account.validated.email_validated = account.validated.email_validated || {};
				        
				            //account.validated.email_validated.is_welcome_mailer_sent = true;
				            var email_object = {
						      email: 'kuldeepp89@gmail.com',
						      data: {
						        link: null
						      },
						      type: 'WELCOME_MAILER',
						      phone: account.phone
						    };
							EmailAndSmsSender.sendWelcomeMail(email_object); 
							
						}

					}
					else {

					}
	          	}	          	 
		        
	            delete account.__v;
		        account.save(function(err) {
		            if (err) console.log(err);
		            console.log('user saved')		            
		        });
		    			
			});
			  
			
		}
	})  	     		    
	