'use strict';
var express = require('express'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    compression = require('compression'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    errorhandler = require('errorhandler'),
    multer  = require('multer'),
    MongoStore = require('connect-mongo')(session);

var Account = require('../models/account');

var Settings = require('./settings');
var Env_config = Settings.values.config[Settings.values.env];

var sessionStore = new MongoStore({
    url: Env_config.db_uri,
    clear_interval: 3600
});

module.exports = function(app) {

    app.use(compression());
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(bodyParser.json());
    app.use(multer());
    app.use(cookieParser('Twyst_2014_Sessions'));
    app.use(session({
        secret: "Twyst_2014_Sessions",
        cookie: {
            maxAge: 31536000000
        },
        store: sessionStore,
        resave: true,
        saveUninitialized: true
    }));
    app.use(methodOverride());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/../../Twyst-Web-Apps/'));

    app.use(favicon(__dirname + '/../../Twyst-Web-Apps/common/images/favicon/twyst.ico'));
    app.all("/api/*", function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With, Accept");
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, HEAD, DELETE, OPTIONS");
        return next();
    });

    passport.use(new LocalStrategy(Account.authenticate()));
    passport.serializeUser(Account.serializeUser());
    passport.deserializeUser(Account.deserializeUser());

    app.use(errorhandler({
        dumpExceptions: true,
        showStack: true
    }));

    mongoose.connect(Env_config.db_uri);

    // mongoose.createConnection("mongodb://twyst:Twyst123@localhost:27017/twyst" ,{auth:{authdb:"twyst"}}, function (a, b) {
    //     console.log(a || b)
    // });

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
      console.log('Mongoose default connection open to: ' + Env_config.server);
    });

    // If the connection throws an error
    mongoose.connection.on('error',function (err) {
      console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
      console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
      mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
      });
    });
};
