var SmsSender = require('./smsSender');

var numbers = [9871303236];
var message = 'Welcome to Twyst. Get all rewards.';

numbers.forEach(function(number) {
	SmsSender.sendSms(number, message);
});