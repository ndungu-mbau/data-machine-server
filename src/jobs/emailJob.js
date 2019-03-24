/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-underscore-dangle */

import * as moment from 'moment';
import { ObjectId } from 'mongodb';

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
    // Show that duplicate records got dropped
    const validationsMap = {};
    const users = await db.collection('user').find({}).toArray();
    const validusers = await db.collection('user_emails').find({}).toArray();

    validusers.forEach((val) => { validationsMap[val.email] = val; });

    for (const x in users) {
      const user = users[x];
      const { email } = user;

      if (email === null || email === undefined) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // special emails we are testing with
      const mails = ['gitomehbranson@gmail.com'];

      if (!mails.includes(email)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const duration = moment(new Date())
        .diff(moment(ObjectId(String(user._id))
          .getTimestamp()), parameters.time_unit);

      if (
        parameters.time_ammount >= duration
        && validationsMap[email][parameters.mail_name] !== true) {
        // send teh mail
      }
    }
  },
  opts: {
    schedule: true,
  },
};
