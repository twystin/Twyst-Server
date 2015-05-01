var schedule = require('node-schedule');
var fs = require('fs');
var sys = require('sys')
var exec = require('child_process').exec;

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(0, 6)];
rule.hour = [1, 9, 17];
rule.minute = 0;
var host_name = "50.112.253.131";

function main() {
	console.log("Backing up PROD DB... :)");
	var date = new Date();
	exec(
		"mongodump --host "+ host_name +" --db twyst --out ./backup/" + date.getHours() +"_baje/", 
		function (err, stdout, stderr) {
		console.log(err || stdout || stderr);
		console.log("DB backup completed for: " + date);
	});
};

var j = schedule.scheduleJob(rule, function(){	
	main();
});

main();