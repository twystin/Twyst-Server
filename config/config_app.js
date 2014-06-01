'use strict';
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

//[AR] For express 4.0
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var session = require('express-session');
var favicon = require('serve-favicon');
var errorhandler = require('errorhandler');

var MongoStore = require('connect-mongo')(session);
var settings = require('./settings');

var sessionStore = new MongoStore({
    url: 'mongodb://localhost:27017/twyst',
    // db: 'session',
    // host: 'mongodb://localhost/twyst',
    clear_interval: 3600
});

module.exports = function(app) {

        app.use(morgan('dev'));
        app.use(bodyParser());
        app.use(cookieParser('some secret'));
        app.use(session({
            secret: "Twyst_2014_Sessions",
            cookie: {
                maxAge: 90 * 24 * 60 * 60 * 1000
            },
            store: sessionStore
        }));
        //app.use(express.session({cookie: { maxAge: 864000000 }}));
        app.use(methodOverride());
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(compression());
        app.use(express.static(__dirname + '/../../Twyst-Web-Apps/'));

        app.use(favicon(__dirname + '/../../Twyst-Web-Apps/common/images/favicon/twyst.ico'));
        app.all("/api/*", function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
            return next();
        });

        var Account = require('../models/account');

        passport.use(new LocalStrategy(Account.authenticate()));
        passport.serializeUser(Account.serializeUser());
        passport.deserializeUser(Account.deserializeUser());

        // use facebook strategy
        var url = "";
        if (settings.values.config[settings.values.env].port !== 80) {
            url = settings.values.config[settings.values.env].server + ":" + settings.values.config[settings.values.env].port;
        } else {
            url = settings.values.config[settings.values.env].server;
        }

        passport.use(new FacebookStrategy({
            clientID: settings.values.config[settings.values.env].clientID,
            clientSecret: settings.values.config[settings.values.env].clientSecret,
            callbackURL: settings.values.config[settings.values.env].callbackURL
        }, function(accessToken, refreshToken, profile, done) {
            var Account = mongoose.model('Account');
            Account.findOne({
                'facebook.id': profile.id
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    user = new Account({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        username: profile.username,
                        provider: 'facebook',
                        facebook: profile._json,
                        role: 6
                    });
                    user.save(function(err) {
                        if (err) {
                            console.log(err);
                        }
                        return done(err, user);
                    });
                } else {
                    return done(err, user);
                }
            });
        }));

        app.use(errorhandler({
            dumpExceptions: true,
            showStack: true
        }));

    // Connect to the database
    // mongoose.connect('mongodb://localhost/twyst', {user: 'code', pass: 'Twyst2014'}, function(err) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    mongoose.connect(settings.values.db);
};
