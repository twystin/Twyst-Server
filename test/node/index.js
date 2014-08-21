'use strict';
var config = require('./config-debug');
var mongoose = require('mongoose');
var superagent = require('superagent');
var r = superagent.agent();
var should = require('chai').should();
var supertest = require('supertest');
var api = supertest('http://localhost:3000');
//var helper = require('../../controllers/checkins/panel/helper.js')
//var panelMain = require('../../controllers/checkins/panel/main.js')

//addition test
/*describe('addition', function() {
    it('should correctly add 1+1 together', function(done) {
        var onePlusOne = 1 + 1;
        onePlusOne.should.equal(2);
        done();
    });
});
*/

//some example code
/*describe('both the methods are working', function(){
    it('should pass the data from 1st method to 2nd', function(done){
        r
    .post( 'http://localhost:3000/api/v1/auth/login' )
    .type('form') // send request in form format
    .send( { username: 9871303236, password: 9871303236 } )
    .end( function(err, res) {
      console.log( 'response for login is ', res.statusCode);
    
    });
    r
    .get( 'http://localhost:3000/api/v1/checkins' )
    .end( function(res) {
      console.log("response for checkins is ", res.statusCode);
    });

    });

});
*/
//sample test
describe('request', function() {
  describe('persistent agent', function() {
    var agent1 = superagent.agent();
    it('should gain a session on POST', function(done) {
      agent1
        .post('http://localhost:3000/api/v1/auth/login')
        .type('form') // send request in form format
      .send({
        username: 'theakitchen',
        password: 'theakitchen'
      })
        .end(function(err, res) {
          //should.not.exist(err);
          console.log("response for login is ", res.statusCode, " ", res.message);
          //  res.should.have.statusCode(200);
          //should.not.exist(res.headers['set-cookie']);
          //res.text.should.include('dashboard');
          done();
        });
    });
    it('should persist cookies across requests', function(done) {
      agent1
        .post('http://localhost:3000/api/v2/checkins').send({
          phone: '8860377473',
          outlet: "530ef84902bc583c21000004"
        })
        .end(function(err, res) {
          //should.not.exist(err);
          console.log("response for checkins is ", res.statusCode, " ", res.message);
          //res.should.have.statusCode(200);
          done();
        });
    });

  });
});

//test for checkins

//test for vouchers

//some example code
/*describe('nearby', function() {
    it('returns JSON', function(done) {
        api.get('/api/v1/near/10/10'
)            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            })
    });
});*/