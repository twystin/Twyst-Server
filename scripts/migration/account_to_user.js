var db = db.getSiblingDB('twyst');
var cursor = db.accounts.find();
while(cursor.hasNext()) {
  c = cursor.next();
  db.users.insert({
    _id: c._id,
    contact_person: c.contact_person,
    company_name: c.company,
    website: c.website,
    facebook_url: c.facebook_url,
    twitter_url: c.twitter_url,
    email: c.profile.email || c.email,
    address: c.address,
    phone: c.phone,
    facebook: c.social_graph && c.social_graph.facebook || c.facebook,
    first_name: c.profile.first_name,
    middle_name: c.profile.middle_name,
    last_name: c.profile.last_name,
    device: {
      id: c.device_id
    },
    validation: {
      otp: c.otp_validated
    },
    user_acquisition_source: (c.batch_user === true) ? 'batch' : null
  });
}
