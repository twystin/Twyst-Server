var schedule = require('node-schedule');
var nodemailer = require('nodemailer');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Summary = require('./summary');
var RawData = require('./rawdata');
var async = require('async');

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(0, 6)];
rule.hour = 10;
rule.minute = 27;

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ar@twyst.in',
        pass: 'Tingu1976'
    }
});

var j = schedule.scheduleJob(rule, function(){

    console.log("Running analytics");
    async.parallel({
        summary: function(callback) {
            Summary.getCount(callback);
        },
        rawdata: function(callback) {
            RawData.execAsyncCommands(callback);
        }
    }, function(err, results) {
        var zip = new AdmZip();
        zip.addLocalFile("./data/summary.csv");
        zip.addLocalFile("./data/checkins.csv");
        zip.addLocalFile("./data/accounts.csv");
        zip.addLocalFile("./data/vouchers.csv");
        zip.writeZip("./data/report.zip");
        var d = new Date();
        var day = d.getDate();
        var month = d.getMonth() + 1; //Months are zero based
        var year = d.getFullYear();
        sendMail(day, month, year);
    });
});

function sendMail (day, month, year) {
    var mailOptions = {
        from: 'Arun Rajappa ✔ ar@twyst.in', // sender address
        to: 'ar@twyst.in, al@twyst.in, rc@twyst.in', // list of receivers
        subject: 'Daily analytics report for: ' + day + '/' + month + '/' + year +'✔', // Subject line
        text: 'Analytics report.', // plaintext body
        html: '<b>Analytics report.</b>', // html body,
        attachments: [{   
            // filename and content type is derived from path
                path: './data/report.zip'
        }]
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
}