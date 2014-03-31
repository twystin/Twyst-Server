/* save shell.js and myaccount.js in \mongodb\bin directory and run the following command from 
command prompt:
mongo myaccount.js
mongo shell.js

These scripts create and use the  database named twyst. 
within the database twyst, these create the following collections:
accounts
outlets
programs
tiers
offers
vouchers
checkins

myaccount.js creates an account with user name 'devender' and password 'abc123'
shell.js populates database twyst by adding  100 documents in each of the collections 

To login to the account,
start app using node
and login from the merchant page using above username and password
*/