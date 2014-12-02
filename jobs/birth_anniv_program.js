var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/twyst');
require('../config/config_models')();

var Outlet = mongoose.model('Outlet');

run();

function run(){
	console.log('here');
	var stream = Outlet.find().stream();
  stream.on('data', function(outlet){
    console.log(outlet.basics.name)
    
    // handle doc
  })
  stream.on('error', function(err){
    // handle error
    console.log(err);
  })
  stream.on('end', function(){
    // final callback
  });
}