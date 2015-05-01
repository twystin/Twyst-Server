db.accounts.find().forEach(
  function(account) {
    var first_name, middle_name, last_name, email;

    if (account.facebook && account.facebook.email && account.profile && !account.profile.email) {
      first_name = account.facebook.name.split(' ')[0];

      if (account.facebook.name.split(' ')[2]) {
        middle_name = account.facebook.name.split(' ')[1] || '';
        last_name = account.facebook.name.split(' ')[2] || '';
      } else {
        last_name = account.facebook.name.split(' ')[1] || '';
      }

      email = account.facebook.email;
    }

    if (account.email && account.profile && !account.profile.email) {
      email = account.email;
    }

    if (account.social_graph && account.social_graph.facebook && account.social_graph.facebook.email &&  account.profile && !account.profile.email) {
      first_name = account.social_graph.facebook.name.split(' ')[0];
      if (account.social_graph.facebook.name.split(' ')[2]) {
        middle_name = account.social_graph.facebook.name.split(' ')[1] || '';
        last_name = account.social_graph.facebook.name.split(' ')[2] || '';
      } else {
        last_name = account.social_graph.facebook.name.split(' ')[1] || '';
      }

      email = account.social_graph.facebook.email;
    }

    if (account.social_graph && account.social_graph.email && account.social_graph.email.email &&  account.profile && !account.profile.email) {
      email = account.social_graph.email.email;
    }

    if (account.name &&  account.profile && !account.profile.first_name) {
      first_name = account.name.split(' ')[0];
      if (account.name.split(' ')[2]) {
        middle_name = account.name.split(' ')[1] || '';
        last_name = account.name.split(' ')[2] || '';
      } else {
        last_name = account.name.split(' ')[1] || '';
      }

    }


    db.accounts.update({
      _id: account._id
    }, {
      $set: {
      	'updated_at': new Date(),
        'profile.first_name': first_name,
        'profile.middle_name': middle_name,
        'profile.last_name': last_name,
        'profile.email': email
      }
    })
  }
)
