'use strict';

module.exports.message = {
	
	error: {
		'statusCode': 400,
		'status': 'error',
		'message': 'Sorry, there was an error saving users check-in. Please try after some time.',
		'info': ''
	},
	program_error: {
		'statusCode': 400,
		'status': 'error',
		'message': 'Check-in error. Sorry, there is no active program for this outlet.',
		'info': ''
	},
	six_hours_error: {
		'statusCode': 400,
		'status': 'error',
		'message': 'Check-in error. User has been checked-in already. Please check-in again on his next visit / order.',
		'info': JSON.stringify(null)
	},
	thirty_minutes_error: {
		'statusCode': 400,
		'status': 'error',
		'message': 'Check-in error. User checked-in recently somewhere else. Please try checking-in here after some time.',
		'info': JSON.stringify(null)
	},
	invalid_mobile_number: {
		'statusCode': 400,
		'status': 'error',
		'message': 'Invalid mobile number. Please check the number you have entered.',
		'info': JSON.stringify(null)
	},
	success: {
		'statusCode': 200,
		'status': 'success',
		'message': '',
		'info': JSON.stringify(null)
	},
};

module.exports.sms = {
	
	error: {
		'message': 'Sorry, there was an error saving your check-in. Please try again with the same code.'
	},
	six_hours_error: {
		'message': 'We’ve already registered your check-in here. Please check-in again on your next visit / order.'
	},
	thirty_minutes_error: {
		'message': 'You’ve checked-in recently somewhere else. Please try checking-in here after some time.'
	},
	success: {
		'message': ''
	}
};