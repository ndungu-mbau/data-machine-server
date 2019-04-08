import * as moment from 'moment';
import { ObjectId } from 'mongodb';

export default {
  name: 'DEACTIVATE_USERS',
  schedule: '* * * * *',
  emediate: false,
  async work({ db, log }) {
    log.info('running a task every minute');
    const col = db.collection('user');
    // Show that duplicate records got dropped
    const users = await col.find({}).toArray();
    users.forEach((user) => {
      // get dates
      const dateB = moment(new Date());
      // eslint-disable-next-line no-underscore-dangle
      const dateC = moment(ObjectId(String(user._id)).getTimestamp());

      const diff = dateB.diff(dateC, 'days'); // get the difference

      if (diff === 40) {
        // if user was created 40 day ago check if he has been activated
        // eslint-disable-next-line no-unused-expressions
        user.userActivated === false
          ? (db
            .collection('userDeactivated')
            .replaceOne({ user }, { user }, { upsert: true }))
          : '';
      }
    });
  },
  opts: {
    schedule: true,
  },
};
