var recursive = require('recursive-readdir');
var fs = require('fs');
var _ = require('underscore');

var files;
recursive('/media/Data/merchants', function (err, files) {
  // Files is an array of filename
  var fileArray = [];
  files.forEach(function(f) {

 
  	var parsed_path = f.split('/');
  	var fileObject = {
  		slug : parsed_path[4],
  		image_name : f
  	}
  	fileArray.push(fileObject);
  })
  fileArray = _.groupBy(fileArray, function(obj){
  	return obj.slug;
  })
  for(var i in fileArray){
  	console.log(i);
  	console.log("-----------------------------------------------------");
  	fileArray[i].forEach(function (file){
  		console.log(file.image_name)
  		if(file.image_name ==='logo.png'){
  			console.log(fs.readFileSync(file.image_name))
	  	}
	  	else if (file.image_name === 'logo1.png'){
	  		console.log(fs.readFileSync(file.image_name))
	  	}
	  	else if (file.image_name === 'Background.png'){
	  		console.log(fs.readFileSync(file.image_name))
	  	}
	  	else {
	  		console.log(fs.readFileSync(file.image_name))
	  	}
  	})
  }
});

