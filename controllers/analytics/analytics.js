var mongoose = require('mongoose'); 

module.exports.getVoucherData = function (req, res) {
	// body...
	var today=new Date();
	var today_comp={
		day:today.getDay(),
		date:today.getDate(),
		month:today.getMonth(),
		year:today.getFullYear()
	};
	var voucher_data = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};
	for(var i=0;i<5;i++){
		var t=(new Date(today_comp.year,today_comp.month,today_comp.date-i)).toString().slice(0,10);
		voucher_data.labels.push(t);
	}
	for(i=0;i<31;i++){
		voucher_data.datasets[0].data[i]=0;
	}
	var diff=function(date1,date2){
		var days = Math.floor((date2.getTime() - date1.getTime())/(1000*60*60*24));
		return days;
	};
	var vouchers=mongoose.model('Voucher');
	vouchers.find({'basics.status':'redeemed'},function(err,result){
		if(err){
			//console.log("devender, take care of error");
		}
		console.log(result);
		for(var j=0;j<result.length;j++){
			var x=result[j]["used_details"]["used_date"];
			x=diff(x,today);
			voucher_data.datasets[0].data[x]++;
		}
		//console.log('voucher_data ');
		//console.log(voucher_data.datasets[0].data);
		res.send({	'status': 'success',
				'message': 'Got voucher data',
				'info': voucher_data
		});
	});
	
}

module.exports.getCheckinData = function (req, res) {
	// body...
	var today=new Date();
	var today_comp={
		day:today.getDay(),
		date:today.getDate(),
		month:today.getMonth(),
		year:today.getFullYear()
	};
	var claim_data = {
        labels : [],
        datasets : [
            {
                data : []
            }
        ]
	};
	for(var i=0;i<5;i++){
		var t=(new Date(today_comp.year,today_comp.month,today_comp.date-i)).toString().slice(0,10);
		claim_data.labels.push(t);
	}
	for(i=0;i<31;i++){
		claim_data.datasets[0].data[i]=0;
	}
	var diff=function(date1,date2){
		var days = Math.floor((date2.getTime() - date1.getTime())/(1000*60*60*24));
		return days;
	};
	var checkins=mongoose.model('Checkin');
	checkins.find({},function(err,result){
		if(err){
			//console.log("devender, take care of error");
		}
		for(var j=0;j<result.length;j++){
			var x=result[j]["checkin_date"];
			x=diff(x,today);
			claim_data.datasets[0].data[x]++;	
		}
		//console.log("checkin data ");
		//console.log(claim_data.datasets[0].data);
		res.send({	'status': 'success',
				'message': 'Got checkin data',
				'info': claim_data
		});
	});	
}
