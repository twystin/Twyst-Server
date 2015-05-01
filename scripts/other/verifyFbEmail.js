db.accounts.find({'role': 7}).forEach(
  function(account) {
    if(account.facebook && account.facebook.email) {
       
      db.accounts.update({
        _id: account._id
      }, {
        $set: {
          'validated.email_validated.status': true
        }
      })
    }
    if(account.social_graph && account.social_graph.facebook  && account.social_graph.facebook.email) {
      db.accounts.update({
        _id: account._id
      }, {
        $set: {
          'validated.email_validated.status': true
        }
      })
    }
    
  
  }
)



