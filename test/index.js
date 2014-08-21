'use strict';
//var config = require('./config-debug');
//var express = require('express');
//var app = require('../app.js');
var assert = require('chai').assert
var mongoose = require('mongoose');
var superagent = require('superagent');
var should = require('chai').should();
var supertest = require('supertest');
var settings = require('../config/settings');
var config_app = require('../config/config_app');
var config_models = require('../config/config_models');
var config_routes = require('../config/config_routes');
//var Account = mongoose.model('Account');

var mongoose = require('mongoose');

mongoose.model('Account', new mongoose.Schema());

var Account = mongoose.model('Account');

/*var Account;
try {
    Account = mongoose.model('Account', schema);
    Account.singular = 'account';
} catch(e) {
    Account = mongoose.model('Account');
}*/
//var api = supertest('http://localhost:3000');
//start test
describe('api', function() {
  describe('for login', function() {
    var agent1 = superagent.agent();
    var agent2 = superagent.agent();
    //test for correct login
    it('should be able to login', function(done) {
      agent1
        .post('http://localhost:3000/api/v1/auth/login')
        .type('form') // send request in form format
      .send({
        username: 'theakitchen',
        password: 'theakitchen'
      })
        .end(function(err, res) {
          //          console.log("response for login is ", res.statusCode);
          assert.equal(res.statusCode, 200, "Statuscode is 200")
          done();
        });
    });

    //test for false login-right username, wrong password
    it('should not able to login because of right username & wrong password', function(done) {
      agent1
        .post('http://localhost:3000/api/v1/auth/login')
        .type('form') // send request in form format
      .send({
        username: 'theakitchen',
        password: 'thekitchen'
      })
        .end(function(err, res) {
          //          console.log("response for login is ", res.statusCode);
          assert.equal(res.statusCode, 401, "statuscode is 401")
          done();
        });
    });

    //test for false login-wrong username, right password
    it('should not able to login because of wrong username & right password', function(done) {
      agent1
        .post('http://localhost:3000/api/v1/auth/login')
        .type('form') // send request in form format
      .send({
        username: 'thekitchen',
        password: 'theakitchen'
      })
        .end(function(err, res) {
          //          console.log("response for login is ", res.statusCode);
          assert.equal(res.statusCode, 401, "statuscode is 401")
          done();
        });
    });

    //test for false login-wrong username, wrong password
    it('should not able to login because of wrong username & wrong password', function(done) {
      agent1
        .post('http://localhost:3000/api/v1/auth/login')
        .type('form') // send request in form format
      .send({
        username: 'thekitchen',
        password: 'thekitchen'
      })
        .end(function(err, res) {
          //          console.log("response for login is ", res.statusCode);
          assert.equal(res.statusCode, 401, "statuscode is 401")
          done();
        });
    });
    /* //test for checkins
    describe('for checkins', function() {
      var agent1 = superagent.agent();
      var agent2 = superagent.agent();
      //valid number & valid outlet-id 
      it('should be able to checkin', function(done) {
        agent1
          .post('http://localhost:3000/api/v2/checkins').send({
            phone: '8860377473',
            outlet: "53e9c4a8ff5ba545f681e03e"
          })
          .end(function(err, res) {
            assert.equal(res.statusCode, 200, "statuscode is 200")
            done();
          });
      });
      //valid number & invalid outlet-id
      it('should not be able to checkin because of valid number & invalid outlet-id', function(done) {
        agent1
          .post('http://localhost:3000/api/v2/checkins').send({
            phone: '8860377473',
            outlet: "false84902bc583c21000004"
          })
          .end(function(err, res) {
            assert.not.equal(res.statusCode, 200, "statuscode is not 200")
            done();
          });
      });

      //invalid number & valid outlet-id
      it('should not be able to checkin because of invalid number & valid outlet-id', function(done) {
        agent1
          .post('http://localhost:3000/api/v2/checkins').send({
            phone: '0000000000',
            outlet: "false84902bc583c21000004"
          })
          .end(function(err, res) {
            assert.not.equal(res.statusCode, 200, "statuscode is 200")
            done();
          });
      });

      //invalid number & invalid outlet-id
      it('should not be able to checkin because of invalid number & invalid outlet-id', function(done) {
        agent1
          .post('http://localhost:3000/api/v2/checkins').send({
            phone: '0000000000',
            outlet: "false84902bc583c21000004"
          })
          .end(function(err, res) {
            assert.not.equal(res.statusCode, 200, "statuscode is 200")
            done();
          });
      });
    });*/
  });
});

//test to be written for vouchers
describe('database', function() {
  describe('tests', function() {
    var agent1 = superagent.agent();
    var agent2 = superagent.agent();
    /*  beforeEach(function(done){
    });

    after(function(done){
    });*/
    //test for correct login
    it('should be able to check for duplicate users', function(done) {
      var flag = 0;
      Account.findOne({
        username: 'pnror'
      }, function(err) {
        if (err) {
          flag = 0;
        } else {
          flag = 1;
        }
      });
      assert.equal(flag,1,"flag is 1");

    });
  });
});

//outlet ids - 530ef84902bc583c21000004, 53e9c4a8ff5ba545f681e03e