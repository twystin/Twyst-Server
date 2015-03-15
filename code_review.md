# Code review notes (15/3)

1. **birthday/birthdayImporter.js**:
    + This imports a list of birthdays into the DB.
    + This should be run whenever we have new phone numbers / profiles.
    + This will be a one-time manual job to be run from any machine.

    + *There are some duplicate files in other directories that do similar stuff*

2. **birthday/job.js**:
    + Sends vouchers to birthday users.
    + ** Incomplete, needs work **

3. **birthday/transport.js**:
    + Reuse of transport code from winback - should consolidate
    + The code is not very good / not used much, should simplify.
    + This code is meant to be the one that actually creates the notification to be sent to the user.

4. **common/*.csv**:
    + These CSV files should probably be deleted from the source tree.

5. **commmon/*.js**:
    + These CSV files should be deleted from the source tree.

6. **config/***: should remove most of these, only config_model and settings are used.

7. **merchnat_mails/***: being used, to review.
8. **mes/***: to look into
9. **models/***: how to keep in sync with server models - make it common.
10.
