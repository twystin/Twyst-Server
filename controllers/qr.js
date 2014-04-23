var mongoose = require('mongoose');
var Outlet = mongoose.model('Outlet');
var QrLib = require('qrpng');
var fs = require('fs');
var keygen = require("keygenerator");
var AdmZip = require('adm-zip');
var Qr = mongoose.model('Qr');
var _ = require("underscore");
var AWS = require('aws-sdk');
var fs = require('fs');

AWS.config.update({
  region: 'us-west-2',
  accessKeyId: 'AKIAJTAQ7XF55TQMK5FA',
  secretAccessKey: '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'
});

var bucket = "qrcodes";

module.exports.qrCreate = function (req, res) {

	var zip = new AdmZip();

	validateQrCreate();
	var qr;
	var num;
	var outlet;
	var count = 0;

	function validateQrCreate() {
		if(req.body) {
			if(req.body.outlet) {
				outlet = req.body.outlet;
				if(req.body.num) {
					num = Number(req.body.num);
					if(req.body.max_use_limit) {
						if(req.body.validity.start && req.body.validity.end) {
							if(req.body.type) {
								qr = {};
								qr.outlet_id = req.body.outlet;
								qr.max_use_limit = req.body.max_use_limit;
								qr.validity = req.body.validity;
								qr.type = req.body.type;
								generateQrCode(num, qr);
							}
							else {
								res.send(400, {
					                status: 'error',
					                message: 'QR code type not selected;',
					                info: ''
					            });
							}
						}
						else {
							res.send(400, {
				                status: 'error',
				                message: 'validity field not selected;',
				                info: ''
				            });
						}
					}
					else {
						res.send(400, {
			                status: 'error',
			                message: 'Max use limit not filled;',
			                info: ''
			            });
					}
				}
				else {
					res.send(400, {
		                status: 'error',
		                message: 'Add number of QR to be generated;',
		                info: ''
		            });
				}
			}
			else {
				res.send(400, {
	                status: 'error',
	                message: 'Please select Outlet;',
	                info: ''
	            });
			}
		}
		else {
			res.send(400, {
	                status: 'error',
	                message: 'Request body empty;',
	                info: ''
	            });
		}
	}

	function generateQrCode (num, qr_n) {
		var qr = {};
		qr = _.extend(qr, qr_n);

		for (var i = 0; i < num; i++) {
			var qrcode = keygen._({forceUppercase: true, length: 6, exclude:['O', '0', 'I', '1']});
			qr.code = qrcode;
			saveQr(qr, i);
		};
	}

	function saveQr (qr, lim) {
		var qr = new Qr(qr);

		qr.save(function (err, qr) {
			if(err) {
				// Do nothing
				console.log(err);
				++count;		
				if(count === num) {
					writeOnDisk(zip);
				}
			}
			else {
				getZipped(qr.code, lim);
			}
		})
	}

	function getZipped(qrcode, lim) {
		QrLib(qrcode, 1.5, function(err, png) {
			zip.addFile(qrcode.toLowerCase() +".png", png);
			++count;		
			if(count === num) {
				writeOnDisk(zip);
			}
		});
	}

	function writeOnDisk(zip) {

		var time = Date.now();
		zip.writeZip(__dirname + '/../../Twyst-Web-Apps/common/'+outlet+"_"+time+".zip");
		res.send(200, {
            status: 'success',
            message: 'Successfully saved QR code for Outlet;',
            info: "/common/"+outlet+"_"+time+".zip"
        });
	}
}