module.exports.rewardTableInsert = function (p) {
	
    var reward = {
    	tier: '';
    	offer: '',
    	checkin_count: ''
    };

    var val = -1;

    var program = p;
    var record = {
    	program: program._id,
    	created_at: Date.now(),
    	updated_at: Date.now(),
    	rewards: []
    };
    
    for(var i = 0; i < program.tiers.length; i++) {
    	if(program.tiers[i]) {
    		for(var lim = program.tiers[i].basics.start_value; lim <= program.tiers[i].basics.end_value; lim++) {
	            for(var j = 0; j < program.tiers[i].offers.length; j++) {
	                obj = {};
	                if(program.tiers[i].offers[j]) {
	                	if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on every') {
		                    if((lim - program.tiers[i].basics.start_value + 1) % program.tiers[i].offers[j].user_eligibility.criteria.value === 0) {
		                        reward.checkin_count = lim;
		                        obj.tier = program.tiers[i];
		                        obj.offer = program.tiers[i].offers[j];
		                        rewards.push(obj);
		                    }
		                }
		                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'on only') {
		                    
		                    if(lim === Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
		                        obj.lim = lim;
		                        obj.tier = program.tiers[i];
		                        obj.offer = program.tiers[i].offers[j];
		                        rewards.push(obj);
		                    }
		                }
		                if(program.tiers[i].offers[j].user_eligibility.criteria.condition === 'after') {
		                    if(lim >= Number(program.tiers[i].offers[j].user_eligibility.criteria.value)) {
		                        obj.lim = lim;
		                        obj.tier = program.tiers[i];
		                        obj.offer = program.tiers[i].offers[j];
		                        rewards.push(obj);
		                    }
		                }
	                }
	            }
	        }	
    	}
        
    }
    //db.insert(record)
}