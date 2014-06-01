'use strict';
var should = require('chai').should();
var supertest = require('supertest');
var api = supertest('http://localhost:3000');

describe('addition', function() {
    it('should correctly add 1+1 together', function(done) {
        var onePlusOne = 1 + 1;
        onePlusOne.should.equal(2);
        done();
    });
});
