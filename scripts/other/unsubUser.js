db.accounts.find().forEach(
  function(account) {

    var unsubUser = {};
    var  message_types = {};
    var sections = {};
    
    sections = {
      all: false,
      outlets: []
    };

    message_types = {
      transact: sections,
      remind: sections, 
      promo: sections,
      all: false,
      outlets: []
    };

    unsubUser = {
      user: account._id,
      phone: account.phone,
      sms: message_types,
      push: message_types,
      blacklisted: account.blacklisted
    }

    db.unsbs.insert(unsubUser);
  }
)
