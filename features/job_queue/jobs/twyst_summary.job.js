var schedule = require('node-schedule');
var nodemailer = require('nodemailer');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Summary = require('./helpers/twyst_summary/summary');
var RawData = require('./helpers/twyst_summary/rawdata');
var async = require('async');

module.exports.run = function(success, error) {
  console.log("Running analytics");
  async.parallel({
    summary: function(callback) {
      Summary.getCount(callback);
    },
    rawdata: function(callback) {
      RawData.execAsyncCommands(callback);
    }
  }, function(err, results) {
    // Need a timeout here
    var zip = new AdmZip();
    zip.addLocalFile("./data/summary.csv");
    zip.addLocalFile("./data/checkins.csv");
    zip.addLocalFile("./data/accounts.csv");
    zip.addLocalFile("./data/vouchers.csv");
    zip.writeZip("./data/report.zip");
    success("done");
    // var d = new Date();
    // var day = d.getDate();
    // var month = d.getMonth() + 1; //Months are zero based
    // var year = d.getFullYear();
    // sendMail(day, month, year);
  });
}




// function sendMail (day, month, year) {
//     var mailOptions = {
//         from: 'Arun Rajappa ✔ ar@twyst.in', // sender address
//         to: 'ar@twyst.in, al@twyst.in, rc@twyst.in', // list of receivers
//         subject: 'Daily analytics report for: ' + day + '/' + month + '/' + year +'✔', // Subject line
//         text: 'Analytics report.', // plaintext body
//         html: '<b>Analytics report.</b>', // html body,
//         attachments: [{
//             // filename and content type is derived from path
//                 path: './data/report.zip'
//         }]
//     };
//
//     transporter.sendMail(mailOptions, function(error, info){
//         if(error){
//             console.log(error);
//         }else{
//             console.log('Message sent: ' + info.response);
//         }
//     });
// }
