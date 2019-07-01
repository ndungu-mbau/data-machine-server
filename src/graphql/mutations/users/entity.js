/* eslint-disable no-underscore-dangle */
import sha1 from 'sha1';

import emit from '../../../app/actions/index';
import actions from '../../../app/actions/action_map';

const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: process.env.NATS_URL,
});

const hemera = new Hemera(nats, {
  logLevel: 'silent',
});

const collection = 'user';

function makeShortPassword() {
  let text = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 4; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

const create = async (args, { db, ObjectId, log }) => {
  const entry = args[collection];

  // check if there is an entry with that phoneNumber
  const existingUser = await db.collection(collection).findOne({ phoneNumber: entry.phoneNumber });
  if (existingUser) {
    // eslint-disable-next-line no-underscore-dangle
    existingUser.id = existingUser._id;
    // eslint-disable-next-line no-console
    log.info('User already exists,upserting', entry.phoneNumber);
  }

  const tempPassword = makeShortPassword();

  // ask for the country and use that here - then ask to confirm
  // ------------------------------------------------------------------------------------------
  if (args.user.sendWelcomeSms === true) {
    const number = phoneUtil.parseAndKeepRawInput(entry.phoneNumber, 'KE');
    const coolNumber = phoneUtil.format(number, PNF.E164);

    const action = {
      topic: 'exec',
      cmd: 'sms_nalm_treasury_pwc_1',
      data: {
        password: entry.password ? entry.password : tempPassword,
        phone: entry.phoneNumber,
      },
    };

    // eslint-disable-next-line no-console
    log.info('sending nalm welcome sms', action);

    hemera.act(action, (err) => {
      if (err) {
        log.info('Error sending sms to ', entry.phoneNumber, coolNumber, err);
      }
    });
  }

  Object.assign(entry, {
    _id: new ObjectId(),
    password: entry.password ? sha1(entry.password) : sha1(tempPassword),
    client: new ObjectId(entry.client),
    destroyed: false,
  });

  await db.collection(collection).updateOne(
    { phoneNumber: entry.phoneNumber },
    { $set: entry },
    { upsert: true, safe: false },
  );

  emit({ action: actions.USER_CREATED, data: entry });
  // eslint-disable-next-line no-underscore-dangle
  entry.id = entry._id;
  return entry;
};

const update = async (args, { db, ObjectId, log }) => {
  const entry = args[collection];


  const shortPass = args.user.generatePass ? makeShortPassword() : undefined;
  const passKeep = entry.password || shortPass;

  if (entry.password || shortPass) {
    entry.password = entry.password ? sha1(entry.password) : sha1(shortPass);
  }

  if (args.user.sendWelcomeSms === true) {
    log.info('sending sms to ====>', entry.phoneNumber);
    const number = phoneUtil.parseAndKeepRawInput(entry.phoneNumber, 'KE');
    const coolNumber = phoneUtil.format(number, PNF.E164);

    const action = {
      topic: 'exec',
      cmd: 'sms_nalm_treasury_pwc_1',
      data: {
        password: passKeep,
        phone: entry.phoneNumber,
      },
    };

    log.info('dispatching ', action);

    // eslint-disable-next-line no-console
    hemera.act(action, (err) => {
      if (err) {
        log.error('Error sending sms to ', entry.phoneNumber, coolNumber, err);
      }
    });
  }

  if (entry.address || entry.contact || entry.phoneNumber) {
    db.collection('saasUser')
      .updateOne({ _id: new ObjectId(entry.id) }, {
        $set: Object.assign({}, entry, {
          id: undefined,
          phoneNumber: entry.phoneNumber,

          address_1: entry.address,
          city: entry.city,
        }, entry.password ? { password: entry.password } : null),
      });
  }
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      {
        $set: Object.assign({}, entry, {
          id: undefined,
          phoneNumber: entry.phoneNumber,

          address_1: entry.address,
          city: entry.city,
        }, entry.password ? { password: entry.password } : null),
      },
    );
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .deleteOne({ _id: new ObjectId(entry.id) });
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: false } });
};

export {
  create,
  update,
  destroy,
  restore,
};
