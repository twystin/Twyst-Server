var conn=new Mongo(); 
var twyst=conn.getDB("twyst");
var dev={username:'devender',
	email:'devendermanu@gmail.com',
	role: 'outlet_manager',
	company:'twyst',
	address:'mansa ram park,uttam nagar',
	contact_person:'jayram',
	phone:971854848,
	website:'www.facebook.com',
	parent:'my parent',
	reset_password_token:'manu',
	remember:'true',
	validated:{
		role_validated:true,
		email_validated:{
			status:true,
			token: 'devender'
		}
	},
	hash:"af1b80012887aebf253778905fab68beb017d180986816d1ce5204fe1b24e5d5dae502b2834ec63f1def0b3618825e67448361d2b35628080926828d37c5d26c1a86a31b0bc7f61f81c3d3f3955652e5e39c63d634f24ea7c43c1b06dbe50914f93d019bbebc16bea81c9885d7c680f4c3b82a20cc05b9c158723097177175496fbcc496b570da89741d890d0b29bd7b85b7160ed5816eb19eb1afd456676fbaedeabbd796ba9ec59993a3760d0177c94caa77282b9a6fa892e70d1a07dd0cded03cff21683cea92bd4d114d96bf579fbaf07d1269514a1fb14184afc419e9e855f8e9fa37b815cd700cd68ada53b450af4089c44cfddd1d72d7e13bd10caf50cf7fc829702e33b7ac1e6faefae811e1464085123af5a552a88d902760ff6dc3164fd046ba880e32493fe335e068cae43a243bb56564078561d4754cd8adb6a81cda9569cb15fa1d9dd30c77123171946a4008b61491ae6993a6b309367b31d628bcc2077e7ae84996d52961eddcaaebb9c69a26cad1944b4e896f346282095f961551a8773da139a9fe35361d9887fd938cd006474c615fffffa2d3e35c65190df26b0f796b62e6fe3aec831d1ed1ae2380b5a459cecf11e9cf01d74c9a9eaddb50a02690b27643827a988d52e9f7fdcb2bc5d4989c495d2d86aa89b55cbf67abd7db248f012d2b7c38f1da4ed95495deb713716f2a5463a0a73724805bbac1",
	salt:"f32973393c59c34fc1e4917b1e98efb6d41cadb2c27349645ce9b93fd6770e46",
	home: {
        latitude: 23,
        longitude: 24	
    }
};
twyst['accounts'].insert(dev);
var x=twyst['accounts'].find().toArray();
print((x[0]["_id"]));
