/* save this file in C:\mongodb\bin directory and run the following command from command prompt:
mongo shell.js

this script creates and uses the  database named twyst. 
within the database twyst, it creates the following collections:
accounts
outlets
programs
tiers
offers
vouchers
checkins
*/


var conn=new Mongo();
var twyst=conn.getDB("twyst");
var email_servers=["yahoo.com","gmail.com","zoho.com","rocketmail.com","rediffmail.com","outlook.com"];
var no_of_outlets=twyst["outlets"].count();
var no_of_accounts=twyst["accounts"].count();
var no_of_tiers=twyst["tiers"].count();
var no_of_offers=twyst["offers"].count();
var no_of_programs=twyst["programs"].count();
var no_of_vouchers=twyst["vouchers"].count();
var x=twyst['accounts'].find().toArray();
var my_id=x[0]["_id"];


/* this function generates a random string of length given by the passed parameter */
var gen_str=function(length){
	var alphabet="abcdefghijklmnopqrstuvwxyz";
	var str='';
	for(var i=0;i<length;i++)
	str+= alphabet[(Math.floor(Math.random()*26))];
	return str;
};

function latLngGenerator()
{
	var a = Math.random()*10 + 30;
	return a;
}
/* this function returns random element from the passed array */
var gen_enum = function(arr){
	var n=arr[(Math.floor(Math.random()*arr.length))];
	return n;
};

/* this function generates a random boolean variable */
var gen_boolean=function(){
	var b=gen_enum([true,false]);
	return b;
};
/*this function  returns a random date between the start and the end date*/
var randomDate=function(start, end) {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
	};
/* this function generates a random date between 9,jan 2004  to the present date */
var gen_date=function(){
	var today=new Date();
	var to=new Date(2014,today.getMonth(),today.getDate()-6);
	var v=randomDate(to,today);
	return (v);
};

/*  function build for generating dates initially (now replaced by gen_date() function */
var gen_date2=function(to){
	var today=new Date();
	var v=randomDate(to,today);
	return (v);	
};


/*function for generating random phone numbers */
var gen_phone=function(){
	var digits='0123456789';
	var num='';
	num+=Math.floor(Math.random()*3)+7;
	for(var i=1;i<10;i++){
		num+=digits[Math.floor(Math.random()*10)];
	}
return Number(num);
};

/* function to return name of a random website */
var gen_site=function(){
return 'www.'+gen_str(8)+'.com';
};

/* function to return name of a random website */
var gen_num=function(from,to){
var num=Math.floor(Math.random()*(to-from))+from;
return num;
};

/*this function returns a random object id from twyst database and given collection */
var random_id = function(colname){
	
	var a=twyst[colname].find().toArray();
	if(a.length===0) {
		print(colname + ' has no documents');
		var a;
		return a;
	}
	var id=a[Math.floor(Math.random()*a.length)]["_id"];
	return id;
};

/*this function returns an array of random object id's from twyst database and given collection */
var random_array=function(colname,num){
	var arr=[];
	var n=0,i=2;
	n=Math.floor(Math.random()*num)+1;
	var col_list=twyst[colname].find().toArray();
	for(i=0;i<n;i++){
		if(col_list.length>0){
			var x=Math.floor(Math.random()*col_list.length);
			arr[i]=col_list[x]['_id'];
			col_list.splice(x,1);
			}
		else 
			break;
	}
	return arr;
};


/* this constructor function creates a random account object and returns it */
function Account(){
	this.username=gen_str(5);
	this.email=gen_str(10)+'@'+gen_enum(email_servers);
	this.role=gen_enum(['root', 'merchant', 'marketing manager', 'outlet manager']);
	this.company=gen_str(20);
	this.address=gen_str(20);
	this.contact_person=gen_str(20);
	this.phone=gen_phone();
	this.website=gen_site();
	this.parent=gen_str(10);
	this.reset_password_token=gen_str(5);
	this.remember=gen_enum(["true","false"]);
	this.home= {};
	this.home.latitude = latLngGenerator();
	this.home.longitude = latLngGenerator();
	this.validated={
		role_validated:true,
		email_validated:{
			status:true,
			token: gen_str(10)
		}
	};
this.hash= "af1b80012887aebf253778905fab68beb017d180986816d1ce5204fe1b24e5d5dae502b2834ec63f1def0b3618825e67448361d2b35628080926828d37c5d26c1a86a31b0bc7f61f81c3d3f3955652e5e39c63d634f24ea7c43c1b06dbe50914f93d019bbebc16bea81c9885d7c680f4c3b82a20cc05b9c158723097177175496fbcc496b570da89741d890d0b29bd7b85b7160ed5816eb19eb1afd456676fbaedeabbd796ba9ec59993a3760d0177c94caa77282b9a6fa892e70d1a07dd0cded03cff21683cea92bd4d114d96bf579fbaf07d1269514a1fb14184afc419e9e855f8e9fa37b815cd700cd68ada53b450af4089c44cfddd1d72d7e13bd10caf50cf7fc829702e33b7ac1e6faefae811e1464085123af5a552a88d902760ff6dc3164fd046ba880e32493fe335e068cae43a243bb56564078561d4754cd8adb6a81cda9569cb15fa1d9dd30c77123171946a4008b61491ae6993a6b309367b31d628bcc2077e7ae84996d52961eddcaaebb9c69a26cad1944b4e896f346282095f961551a8773da139a9fe35361d9887fd938cd006474c615fffffa2d3e35c65190df26b0f796b62e6fe3aec831d1ed1ae2380b5a459cecf11e9cf01d74c9a9eaddb50a02690b27643827a988d52e9f7fdcb2bc5d4989c495d2d86aa89b55cbf67abd7db248f012d2b7c38f1da4ed95495deb713716f2a5463a0a73724805bbac1";
this.salt= "f32973393c59c34fc1e4917b1e98efb6d41cadb2c27349645ce9b93fd6770e46";

};


/* this constructor function creates a random checkin object and returns it */
function Checkin(){
	this.checkin_date=gen_date();
	this.checkin_validated=gen_boolean();
	this.created_date=gen_date();
	this.modified_date=gen_date();
	this.account_id=(no_of_accounts>0)?my_id:undefined;
	this.program_id=(no_of_programs>0)?random_id("programs"):undefined;
	this.outlet_id=(no_of_outlets>0)?random_id('outlets'):undefined;
}

/* this constructor function creates a random offer object and returns it */
function Offer(){
	this.username=gen_str(10);
	this.basics={
		title:gen_str(10),
		slug: gen_str(10),
		description: gen_str(20),
		image: [gen_str(10),gen_str(15)],
		created_at: gen_date(),
		modified_at: gen_date()
	};
	this.terms=gen_str(10);
	this.reward={
		discount:{
			max:gen_str(10),
			percentage: Math.floor(Math.random()*50)
		},
		flat:{
			off:gen_str(10),
			spend: gen_str(10)
		},
		free:{
			title: gen_str(10),
			free_eligibility_type: gen_str(10),
			free_eligibility_detail: gen_str(10)
		},
		reduced:{
			what: gen_str(10),
			worth: gen_str(10),
			for_what: gen_str(10)
		},
		happyhours:{
			extension: gen_str(10)
		},
		custom:{
			text: gen_str(10),
		}
	};
	this.user_eligibility={
		criteria: gen_enum(['on every', 'after', 'on only']),
		value: gen_str(10)
	};
	this.reward_applicability={
	time_of_day: gen_enum(['breakfast', 'brunch', 'lunch', 'dinner', 'happy hours', 'all day']),
	day_of_week:gen_enum(['weekdays', 'weekends', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
	};
}


//* this constructor function creates a random outlet object and returns it */
function Outlet(){
	this.username=gen_str(20);
	this.basics={
		name:gen_str(15),
		slug:gen_str(20),
		relationship:gen_enum(['owner', 'franchisee']),
		mechant_name:gen_str(20),
		contact_person_name:gen_str(10),
		size:gen_str(10),
		is_a:gen_enum(['bakery', 'cafe', 'desserts', 'fast_food', 'pub', 'restaurant', 'takeaway', 'other']),
		franchise:gen_enum([true,false]),
		images:gen_str(20),
		created_at:gen_date(),
		modified_date:gen_date()
		};
	this.contact={
		location:{
			coords:{latitude:latLngGenerator(),longitude:latLngGenerator()},
			address: gen_str(20),
			map_url: gen_site(),
			landmarks:[gen_str(10),gen_str(10)],
			locality1:[gen_str(10),gen_str(10)],
			locality2:[gen_str(10)],
			city:gen_str(10),
			pin:100000+Math.floor(Math.random()*99999)
		},
		phones:[{
			prefix:Math.floor(Math.random()*1000),
			type:gen_enum(['landline', 'mobile', 'other']),
			number:gen_phone()
		}],
		emails:[{
			person:gen_str(10),
			email:gen_str(10)+'@'+gen_enum(email_servers),
			type:gen_enum(['personal', 'work'])
		}]
	};
	this.links={
		website_url:gen_site(),
		facebook_url:gen_str(10)+'@facebook.com',
		twitter_url: gen_str(10)+'@twitter.com',
		youtube_url: gen_str(10)+'@youtube.com',
		other_urls:[{
			link_name:gen_str(10),
			link_url:gen_site()
		}]
	};
	this.attributes={
		home_delivery:gen_boolean(),
		dine_in:gen_boolean(),
		veg: gen_boolean(),
		alcohol:gen_boolean(),
		outdoor:gen_boolean(),
		foodcourt:gen_boolean(),
		smoking:gen_boolean(),
		chain:gen_boolean(),
		air_conditioning:gen_enum(['yes', 'no', 'partial']),
		parking:gen_enum(['yes', 'no', 'valet']),
		reservation:gen_enum(['recommended', 'not_required']),
		wifi:gen_enum(['no', 'free', 'paid']),
		cost_for_two:gen_enum(['1', '2', '3','4','5']),
		timings:gen_str(10),
		cuisines:[gen_str(10),gen_str(10)],
		pament_options:gen_enum(['cash', 'visa', 'master', 'amex', 'sodexho']),
		tags:gen_str(10)
	};
	this.photos=[{
		title:gen_str(10),
		image: gen_str(10),
		thumbnail:gen_str(10),
		alt_text:gen_str(10)
	}];
	this.outlet_meta={
		accounts:[],
		status:gen_enum(['active', 'archived']),
		links:[]
	};
	this.twyst_meta={
		rating:{
			count:Math.floor(Math.random()*10),
			value:Math.floor(Math.random()*6)
		},
		reviews:[{
			review:gen_str(10)
		}],
		recommend_list:[]
	};
	this.outlet_meta.accounts=random_array("accounts",3);
	this.outlet_meta.accounts[this.outlet_meta.accounts.length]=my_id;
	this.outlet_meta.links=random_array("outlets",4);
	this.twyst_meta.recommend_list=random_array("outlets",3);
}

/* this constructor function creates a random program object and returns it */
function Program(){
	this.name=gen_str(20);
	this.slug=gen_str(10);
	this.created_at=gen_date();
	this.modified_at=gen_date2(this.created_at);
	this.validity={
		earn_start:gen_date(),
		earn_end:gen_date(),
		burn_start:gen_date(),
		burn_end:gen_date()
	};
	this.images=[gen_str(20),gen_str(20)];
	this.accounts=[];
	this.outlets=[];
	this.tiers=[];
	this.accounts=random_array("accounts",4);
	this.accounts[this.accounts.length]=my_id;
	this.outlets=random_array("outlets",5);
	this.tiers=random_array("tiers",5);
}



/* this constructor function creates a random tier object and returns it */
function Tier(){
	this.basics={
		username: gen_str(15),
		name: gen_str(15),
		slug: gen_str(10),
		start_value:gen_str(10),
		end_value:gen_str(10),
		created_at: gen_date(),
		modified_at: gen_date(),
	};
	this.offers=[];
	this.offers=random_array("offers",5);
}

/* this constructor function creates a random checkin object and returns it */
function Voucher(){
	this.basics={
		name: gen_str(20),
		slug: gen_str(20),
		code: gen_str(20),
		description: gen_str(20),
		type: gen_str(10),
		applicability: gen_str(20),
		status:gen_enum(['active', 'archived', 'redeemed']),
		created_at: gen_date(),
		modified_at: gen_date()
		};
	this.validity={
		start_date: gen_date(),
		end_date:gen_date(),
		number_of_days: Math.floor(Math.random()*365)
		};
	this.issue_details={
		issue_date:gen_date(),
		issue_time: gen_date(),
		issue_to:''
		};
	this.used_details={
		used_by:'',
		used_at:'',
		used_date:gen_date()
		};
	this.redemption_phone_number=gen_phone(),
	this.free_text=gen_str(20);
	this.used_details.used_at=random_id("outlets");
	var xvo=twyst["outlets"].find({'_id':this.used_details.used_at} ).toArray();
	var yvo=xvo[0]['outlet_meta']['accounts'];
	this.used_details.used_by=yvo;
	this.issue_details.issue_to=this.used_details.used_by;
}

/*this function takes the database name , a collection name and insert num numbers of randomly 
generated objects into the mongodb collection */
/*This is the main function for populating the database */

function indata(colName, num) {
	
	for (i = 0; i < num; i++) {
		var tmp;
		
		switch(colName){    // for appropriately selecting a schema
		case 'accounts':
		tmp =new Account();
		no_of_accounts++;	//incrementing total number of accounts by 1
		break;

		case 'outlets':
		tmp=new Outlet();
		no_of_outlets++;
		break;

		case 'offers':
		tmp=new Offer();
		no_of_offers++;
		break;

		case 'programs':
		tmp=new Program();
		no_of_programs++;
		break;

		case 'tiers':
		tmp=new Tier();
		no_of_tiers++;
		break;

		case 'checkins':
		tmp=new Checkin();
		break;

		case 'vouchers':
		tmp=new Voucher();
		no_of_vouchers++;
		break;


		}
	twyst[colName].insert(tmp);
	}
print(twyst[colName].count());


}



/*populating the database using above function */
indata("offers",100);
print("offers added");
indata("tiers",100);
print("tiers added");
indata("accounts",100);
print("accounts added");
indata("outlets",100);
print("outlets added");
indata("programs",100);
print("programs added");
indata("vouchers",100);
print("vouchers added");
indata("checkins",100);
print("checkins added");
