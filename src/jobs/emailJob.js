import cron from 'node-cron';
import config from '../config';
import * as moment from 'moment';
import { ObjectId } from 'mongodb';
import { strict } from 'assert';

const parameters = {
  time_unit: 'months',
  time_ammount: '2',
  mail_name: 'registration',
};

export default {
  name: 'EMAIL_JOB',
  schedule: '* * * * *',
  emediate: false,
  async work({ db }) {
    console.log('sending ', parameters.mail_name, ' emails');

    // Show that duplicate records got dropped
    const validationsMap = {};
    const users = await db.collection('user').find({}).toArray();
    const validusers = await db.collection('user_emails').find({}).toArray();

    validusers.map(val => validationsMap[val.email] = val);

    for (const x in users) {
      const user = users[x];
      const { email } = user;

      // console.log(user)
      if (email === null || email === undefined) {
        continue;
      }

      // special emails we are testing with
      const mails = ['gitomehbranson@gmail.com'];

      if (!mails.includes(email)) {
        continue;
      }

      const duration = moment(new Date()).diff(moment(ObjectId(String(user._id)).getTimestamp()), parameters.time_unit);

      if (parameters.time_ammount >= duration && validationsMap[email][parameters.mail_name] !== true) {
        // console.log(email,"is more or equal than",parameters.time_ammount, parameters.time_unit,"and hasnt gotten an email" )

        console.log('sending mail to ', email);
        const validusers = await db
          .collection('user_emails')
          .updateOne(
            { email },
            {
              $set: {
                [parameters.mail_name]: true,
              },
            },
            { upsert: true },
          );
      } else {
        console.log('not sending to', email, 'already sent before');
      }
    }
  },
  opts: {
    schedule: true,
  },
};
