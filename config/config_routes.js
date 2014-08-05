'use strict';

var mongoose = require('mongoose');
var passport = require('passport');

module.exports = function (app) {
    //Check if a User is authenticated
    function checkAuthenticated() {
        return function (req, res, next) {
            if (req.isAuthenticated()) {
                next();
            } else {
                res.send(401, {'status': 'error',
                    'message': 'We got an Authentication Faliure. Try logging in again.',
                    'info': ''});
            }
        };
    }

    function checkRole(role) {
        return function (req, res, next) {
            if (isAuthorized(role, req)) {
                next();
            } else {
                res.send(403, {'status': 'error',
                    'message': 'You are not supposed to be here!',
                    'info': ''
                });
            }
        };
    }

    function isAuthorized(role, req) {
        if(req.user.role) {
            if(req.user.role <= role) {
                return true;
            }
            return false;
        }
        return false;
    };

    (function panel_route() {
        var PanelCtrl = require('../controllers/checkins/panel/main');
        var AllCheckinCtrl = require('../controllers/analytics/checkins');
        var AllVoucherCtrl = require('../controllers/analytics/vouchers');
        app.post('/api/v2/checkins', PanelCtrl.checkin);
        app.get('/api/v2/allcheckins/:outlet/:program', AllCheckinCtrl.getCheckins);
        app.get('/api/v2/allvouchers/:outlet/:program', AllVoucherCtrl.getVouchers);
        app.get('/api/v2/allredeems/:outlet/:program', AllVoucherCtrl.getRedeems);
    })();

    (function admin_route() {
        var DataCtrl = require('../controllers/admin/dataCtrl');
        var StatusCtrl = require('../controllers/admin/status');
        var UserCtrl = require('../controllers/admin/user');
        var QrCtrl = require('../controllers/admin/qr');
        var AnonDataCtrl = require('../controllers/admin/dataCtrlAnonymous');
        app.post('/api/v2/admin/outlets/', AnonDataCtrl.getAnonData);
        app.get('/api/v2/merchants', DataCtrl.getMerchants);
        app.post('/api/v2/outlets/city/', DataCtrl.getOutlets);
        app.get('/api/v2/admin/programs/:outlets', DataCtrl.getPrograms);
        app.get('/api/v2/admin/data/:program/:start/:end', DataCtrl.getData);
        app.get('/api/v2/total_checkins', AnonDataCtrl.totalCheckins);
        app.get('/api/v2/alloutlets', StatusCtrl.getAllOutlets);
        app.get('/api/v2/allprograms', StatusCtrl.getAllPrograms);
        app.get('/api/v2/allusers', UserCtrl.getAllUsers);
        app.get('/api/v2/allqrs', QrCtrl.getAllQrs);
        app.post('/api/v2/changestatus/outlet', StatusCtrl.changeOutletStatus);
        app.post('/api/v2/changestatus/program', StatusCtrl.changeProgramStatus);
        app.post('/api/v2/changevalidity/qr', QrCtrl.updateValidity);
    })();

    (function user_data_route() {
        var UserDataCtrl = require('../controllers/user/userDataCtrl');
        app.get('/api/v2/data/:latitude/:longitude', UserDataCtrl.getData);
    })();

    (function user_const_route() {
        var UserConstCtrl = require('../controllers/user/userConstCtrl');
        app.get('/api/v2/constants', UserConstCtrl.getConst);
    })();

    (function user_otp_route() {
        var OtpCtrl = require('../controllers/otpCtrl.js');
        app.get('/api/v2/otp/:mobile', OtpCtrl.getOTP);
        app.post('/api/v2/otp', OtpCtrl.updateDeviceId);
    })();

    (function public_route() {
        var OutletCtrl = require('../controllers/outlet');
        app.get('/api/v1/public/outlets/all', OutletCtrl.all);
        app.get('/api/v1/publicview/outlets/:outlet_id', OutletCtrl.publicview);
    })();
    // Route to send mails
    (function mailer_routes() {
        var MailerCtrl = require('../controllers/mailer');
        app.put('/api/v1/pass/forgot/:username', MailerCtrl.forgot);
        app.put('/api/v1/resend/validation/', MailerCtrl.validationEmail);
        app.post('/api/v1/sendfeedback', checkAuthenticated(), MailerCtrl.feedbackEmail);
    })();
    //Change password and reset passwords
    (function password_reset_routes() {
        var ResetCtrl = require('../controllers/reset_password');
        app.put('/api/v1/pass/reset/:token', ResetCtrl.resetPassword);
        app.put('/api/v1/pass/change/:user_id', checkAuthenticated(), ResetCtrl.changePassword);
    })();
    //Image uploader to upload images to S3
    (function image_routes() {
        var ImageCtrl = require('../controllers/image_uploader');
        app.put('/api/v1/image/upload/', ImageCtrl.upload);
    })();
    //Register user and login as well as other auth routes
    (function authentication_routes() {
        var AccountCtrl = require('../controllers/account'),
            MailerCtrl = require('../controllers/mailer');
        app.post('/api/v1/auth/login', passport.authenticate('local'), AccountCtrl.login);

        app.post('/api/v1/auth/register', AccountCtrl.register, MailerCtrl.validationEmail);
        app.get('/api/v1/auth/logout', AccountCtrl.logout);
        app.get('/api/v1/auth/users', checkAuthenticated(), checkRole(3), AccountCtrl.query);
        app.get('/api/v1/auth/users/:user_id', checkAuthenticated(), checkRole(4), AccountCtrl.read);
        app.put('/api/v1/auth/users/:user_id', checkAuthenticated(), checkRole(7), AccountCtrl.update);
        app.put('/api/v1/auth/users/validate/:user_id', AccountCtrl.validateByConsole);
        app.put('/api/v1/auth/validate/email/:token', AccountCtrl.setEmailValidated)
        app.delete('/api/v1/auth/users/:user_id', checkAuthenticated(), checkRole(3), AccountCtrl.delete);

        app.get('/api/v1/auth/facebook', passport.authenticate('facebook', {
            scope: [ 'email', 'user_about_me'],
            failureRedirect: '/login'
        }), function (req, res) {});

        app.get('/api/v1/auth/facebook/callback',
            passport.authenticate('facebook', { failureRedirect: '/login' }),
            function(req, res) {
                // Successful authentication, redirect home.
                res.send(200);
            });

        app.get('/api/v1/auth/get_logged_in_user', function (req,res) {
            if(req.user) {
               res.send(200, {status: 'success', user: req.user}); 
            }
            else {
                res.send(401, {status: 'error'});
            }
        });

        app.post('/api/v1/auth/login', function (req, res) {
            console.log(req.body);
            req.login(req.body, function (err) {
                console.log(err);
                console.log("logged in");
            });
        });
    })();


    //Create new users and view all users
    (function manage_users_routes() {
        var UserCtrl = require('../controllers/manage_user');
        app.post('/api/v1/auth/register/user', checkAuthenticated(), checkRole(4), UserCtrl.register);
        app.get('/api/v1/getusers/:user_id', checkAuthenticated(), checkRole(4), UserCtrl.getManagers);
    })();

    //Create new users and view all users
    (function recco_config_routes() {
        var ReccoConfigCtrl = require('../controllers/recco_config');
        app.get('/api/v2/recco_config', checkAuthenticated(), checkRole(1), ReccoConfigCtrl.read);
        app.put('/api/v2/recco_config', checkAuthenticated(), checkRole(1), ReccoConfigCtrl.update);
    })();

    //Create log for users
    (function user_log_routes() {
        var LogCtrl = require('../controllers/log');
        var SmsLogCtrl = require('../controllers/smslog');
        app.post('/api/v1/log', LogCtrl.createLog);
        app.post('/api/v1/smslog', SmsLogCtrl.createLog);
        app.get('/api/v2/sms/status', SmsLogCtrl.deliveryReport)
    })();

    //SMS route
    (function user_sms_routes() {
        var SMSRCtrl = require('../controllers/sms_parser');
        var GetAppCtrl = require('../controllers/getapp');

        app.get("/api/v1/sms", SMSRCtrl.reciever);
        app.get("/api/v1/download/app", GetAppCtrl.getApp);
        app.get('/api/v1/sms/provider', function (req,res) {
            res.send(200, {
                status: 'success',
                message: 'Got the SMS provider information',
                info: {number: '+919266801954', prefix: 'CHK', code: ''}
            });
        });
    })();

    //Outlet CRUD routes
    (function outlet_routes() {
        var OutletCtrl = require('../controllers/outlet');
        app.get('/api/v1/outlets/count/:user_id', checkAuthenticated(), checkRole(5), OutletCtrl.getCount);
        app.get('/api/v1/outlets/programs/:outlet_id', OutletCtrl.getOffersForOutlet);
        app.get('/api/v1/outlets/:user_id', checkAuthenticated(), checkRole(5), OutletCtrl.query);
        app.get('/api/v1/near/:latitude/:longitude', OutletCtrl.nearbyOutlets);
        app.get('/api/v1/outlet/console', checkRole(1), OutletCtrl.consoleQuery);
        app.get('/api/v1/outlets/view/:outlet_id', checkAuthenticated(), checkRole(4), OutletCtrl.read);
        app.post('/api/v1/outlets', checkAuthenticated(), checkRole(4), OutletCtrl.create);
        app.put('/api/v1/outlets/:outlet_id', checkAuthenticated(), checkRole(4), OutletCtrl.update);
        app.delete('/api/v1/outlets/:outlet_id', checkAuthenticated(), checkRole(4), OutletCtrl.archived);
    })();


    //QR create route
    (function qr_routes() {
        var QrCtrl = require('../controllers/qr');
        app.post('/api/v1/qr/outlets', checkAuthenticated(), checkRole(1), QrCtrl.qrCreate);
    })(); 


    //Program CRUD routes
    (function program_routes() {
        var ProgramCtrl = require('../controllers/program');
        app.get('/api/v1/programs/count/:user_id', checkAuthenticated(), checkRole(5), ProgramCtrl.getCount);
        app.get('/api/v1/programs/offer/:offer_id', checkAuthenticated(), checkRole(4), ProgramCtrl.getProgramByOffer);
        app.get('/api/v1/programs/:user_id', checkAuthenticated(), checkRole(5), ProgramCtrl.query);
        app.get('/api/v1/programs/only/:user_id', checkAuthenticated(), checkRole(4), ProgramCtrl.onlyPrograms);
        app.get('/api/v1/public/programs/', ProgramCtrl.publicQuery);
        app.get('/api/v1/programs/view/:program_id', ProgramCtrl.readOne);
        app.post('/api/v1/programs', checkAuthenticated(), checkRole(4), ProgramCtrl.create);
        app.put('/api/v1/programs/:program_id', checkAuthenticated(), checkRole(4), ProgramCtrl.update);
        app.delete('/api/v1/programs/:program_id', checkAuthenticated(), checkRole(4), ProgramCtrl.delete);
    })();


    //Voucher CRUD routes
    (function voucher_routes() {
        var VoucherCtrl = require('../controllers/voucher');
        var VoucherRedeemCtrl = require('../controllers/voucher_redeem');
        //app.get('/api/v1/vouchers', checkAuthenticated(), VoucherCtrl.query);
        app.get('/api/v1/vouchers/:code/:searchedAt', checkAuthenticated(), checkRole(5), VoucherCtrl.read);
        app.get('/api/v1/vouchers_by_phone/:phone', checkAuthenticated(), checkRole(5), VoucherCtrl.readByUserPhone);
        app.post('/api/v1/vouchers', checkAuthenticated(), VoucherCtrl.create);
        app.get('/api/v1/vouchers/status/change/:code', checkAuthenticated(), checkRole(5), VoucherCtrl.changeStatus);
        app.post('/api/v1/voucher/sms/redeem', VoucherRedeemCtrl.recieveSmsRedeem);
        app.post('/api/v1/voucher/app/redeem', checkAuthenticated(), VoucherRedeemCtrl.redeemVoucherApp);
        app.post('/api/v1/redeem/vouchers', checkAuthenticated(), checkRole(5), VoucherRedeemCtrl.redeemVoucherPanel);
        app.put('/api/v1/vouchers/:voucher_id', checkAuthenticated(), VoucherCtrl.update);
        app.delete('/api/v1/vouchers/:voucher_id', checkAuthenticated(), VoucherCtrl.delete);
    })();


    // Analytics route
    (function analytics_routes () {
        var AnalyticsCtrl = require('../controllers/analytics/analytics');
        var SummaryCtrl = require('../controllers/analytics/summary');
        var FreqCtrl = require('../controllers/analytics/frequency');
        var CheckinCtrl = require('../controllers/analytics/checkin_analytics');
        var VoucherCtrl = require('../controllers/analytics/voucher_analytics');
        app.get('/api/v1/getcounts/:outlet_id/:program_id', checkAuthenticated(), checkRole(5), SummaryCtrl.getCounts);
        app.get('/api/v1/analytics/checkins/:program_id', checkAuthenticated(), checkRole(4), SummaryCtrl.getSummaryCheckins);
        app.get('/api/v1/analytics/vouchers/:program_id', checkAuthenticated(), checkRole(4), SummaryCtrl.getSummaryVouchers);
        app.get('/api/v1/analytics/freq/checkins/:program_id', checkAuthenticated(), checkRole(4), FreqCtrl.getFrequencyCheckins);
        app.get('/api/v1/analytics/getvoucherdata', checkAuthenticated(), checkRole(4), AnalyticsCtrl.getVoucherData);
        app.get('/api/v1/analytics/getcheckindata', checkAuthenticated(), checkRole(4), AnalyticsCtrl.getCheckinData);
        app.get('/api/v1/analytics/checkins', checkAuthenticated(), checkRole(4), CheckinCtrl.getAllCheckins);
        app.get('/api/v1/analytics/checkin_count', checkAuthenticated(), checkRole(4), CheckinCtrl.getAllCheckinCount);
        app.get('/api/v1/analytics/vouchers', checkAuthenticated(), checkRole(4), VoucherCtrl.getAllVouchers);
        app.get('/api/v1/analytics/voucher_count', checkAuthenticated(), checkRole(4), VoucherCtrl.getAllVoucherCount);
    })();


    //Voucher CRUD routes
    (function program_edit_routes() {
        var TierCtrl = require('../controllers/tier');
        var OfferCtrl = require('../controllers/offer');
        app.post('/api/v1/add/tiers/:program_id', checkAuthenticated(), checkRole(4), TierCtrl.addTier);
        app.post('/api/v1/add/offers/:tier_id', checkAuthenticated(), checkRole(4), OfferCtrl.addOffer);
        app.put('/api/v1/tiers/:tier_id', checkAuthenticated(), checkRole(4), TierCtrl.update);
        app.put('/api/v1/offers/:offer_id', checkAuthenticated(), checkRole(4), OfferCtrl.update);
        app.delete('/api/v1/delete/tier/:tier_id', checkAuthenticated(), checkRole(4), TierCtrl.deleteTier);
        app.delete('/api/v1/delete/offer/:offer_id', checkAuthenticated(), checkRole(4), OfferCtrl.deleteOffer);
    })();

    (function offer_routes() {
        var OfferCtrl = require('../controllers/offer');
        app.get('/api/v1/offers/:offer_id', OfferCtrl.read);
    })();


    //Checkin CRUD routes
    (function checkin_routes() {
        var CheckinCtrl = require('../controllers/checkin');
        app.get('/api/v1/checkins',checkAuthenticated(), checkRole(5), CheckinCtrl.query);
        app.post('/api/v1/qr/checkins', checkAuthenticated(), checkRole(7), CheckinCtrl.qrCheckin);
        app.get('/api/v1/checkins/:checkin_id',checkAuthenticated(),checkRole(5), CheckinCtrl.read);
        app.post('/api/v1/checkins',checkAuthenticated(), checkRole(5), CheckinCtrl.panelCheckin);
        app.put('/api/v1/checkins/:checkin_id',checkAuthenticated(), checkRole(5), CheckinCtrl.update);
        app.delete('/api/v1/checkins/:checkin_id',checkAuthenticated(), checkRole(5), CheckinCtrl.delete);
    })();


    //Favourites management routes
    (function favourite_routes() {
        var FavouriteCtrl = require('../controllers/favourites');
        app.get('/api/v1/favourites', checkAuthenticated(), checkRole(7), FavouriteCtrl.query);
        app.get('/api/v1/favourites/:favourite_id', checkAuthenticated(), checkRole(7), FavouriteCtrl.read);
        app.post('/api/v1/favourites', checkAuthenticated(), checkRole(7), FavouriteCtrl.create);
        app.delete('/api/v1/favourites/:outlet_id/:offer_id', checkAuthenticated(), checkRole(7), FavouriteCtrl.delete);
    })();


    //Recommendation routes
    (function recommendation_routes() {
        var RecoCtrl = require('../controllers/recommendation');
        var NewRecoCtrl = require('../controllers/recommendations/main');
        app.get('/api/v1/recommendations', RecoCtrl.getRecommendedPrograms);
        app.get('/api/v2/recommendations', NewRecoCtrl.getRecco);
    })();


    //Beta launchpage and User signup routes
    (function beta_routes() {
        var BetaUserCtrl = require('../controllers/beta_users');
        var BetaMerchantCtrl = require('../controllers/beta_merchants');
        app.post('/api/v1/beta/users', BetaUserCtrl.create);
        app.post('/api/v1/beta/merchants', BetaMerchantCtrl.create);

    })();

    (function version_routes() {
        var VersionCtrl = require('../controllers/version');
        app.get('/api/v1/clientversion', VersionCtrl.getVersion);
    })();

    (function notification_routes() {
        var NotifCtrl = require('../controllers/push_notification');
        app.post('/api/v2/notifs',NotifCtrl.save);
    })();

    (function typeahead_routes() {
        var TACtrl = require('../controllers/typeahead');
        app.get('/api/v1/typeahead/tags/:name', TACtrl.getTypeaheadTags);
    })();

    (function user_routes() {
        var UserCtrl = require('../controllers/user');
        app.post('/api/v2/social',checkAuthenticated(), checkRole(7), UserCtrl.socialUpdate);
        app.get('/api/v1/mycheckins',checkAuthenticated(), checkRole(7), UserCtrl.myCheckins);
        app.get('/api/v1/myvouchers',checkAuthenticated(), checkRole(7), UserCtrl.myVouchers);
        app.get('/api/v2/friends',checkAuthenticated(), checkRole(7), UserCtrl.friendsOnTwyst);
        app.post('/api/v1/user/home', UserCtrl.setHome) ;//User authentication to be added here
        app.post('/api/v1/user/gcm', UserCtrl.setGCM) ;//User authentication to be added here
    })();

    (function typeahead_routes() {
        var RedirectCtrl = require('../controllers/redirect');
        app.get('/r/:key', RedirectCtrl.getRedirected);
    })();

    (function notify_routes() {
        var VoucherNotifyCtrl = require('../controllers/notifications/voucher');
        var CommonNotifyCtrl = require('../controllers/notifications/common');
        app.get('/api/v1/notify/voucher',checkAuthenticated(),checkRole(5), VoucherNotifyCtrl.getVoucherNotify);
        app.get('/api/v2/notify/merchants/:skip',checkAuthenticated(),checkRole(5), CommonNotifyCtrl.getNotifs);
    })();

    (function testing_routes (){
        app.get('/:type(gurgaon|delhi)/*', function (req, res) {
            res.send(200, {info: 'This works. Wow :)'});
        });
    })();

    (function handle_defaults() {
        app.use(function (req, res){
            res.send(404, {'info': '...Page not found'});
        });
    })();
};