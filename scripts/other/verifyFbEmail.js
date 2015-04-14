db.accounts.find({'role': 7}).forEach(
  function(account) {
    if(account.facebook) {
       
      db.accounts.update({
        _id: account._id
      }, {
        $set: {
          'validated.email_validated.status': true
        }
      })
    }
    if(account.social_graph.facebook) {
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



