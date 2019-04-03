import sha1 from 'sha1';

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

  for (let i = 0; i < 4; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }

  return text;
}

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];

  // check if there is an entry with that phoneNumber
  const existingUser = await db.collection(collection).findOne({ phoneNumber: entry.phoneNumber });
  if (existingUser) {
    // eslint-disable-next-line no-underscore-dangle
    existingUser.id = existingUser._id;
    // eslint-disable-next-line no-console
    console.log('User already exists,upserting', entry.phoneNumber);
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
    console.log(action);

    hemera.act(action, (err) => {
      if (err) {
        console.log('Error sending sms to ', entry.phoneNumber, coolNumber, err);
      }
    });
  }
  Object.assign(entry, {
    _id: new ObjectId(),
    password: entry.password ? sha1(entry.password) : sha1(tempPassword),
    client: new ObjectId(entry.client),
    destroyed: false,
  });
  await db.collection(collection).update(
    { phoneNumber: entry.phoneNumber },
    entry,
    { upsert: true, safe: false },
  );
  // eslint-disable-next-line no-underscore-dangle
  entry.id = entry._id;
  return entry;
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  if (entry.password) {
    entry.password = sha1(entry.password);
  }

  const tempPassword = makeShortPassword();

  if (args.user.sendWelcomeSms === true) {
    console.log("sending sms to ====>", entry.phoneNumber)
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
    console.log(action);

    hemera.act(action, (err) => {
      if (err) {
        console.log('Error sending sms to ', entry.phoneNumber, coolNumber, err);
      }
    });
  }

  if (entry.address || entry.contact || entry.phoneNumber) {
    db.collection('saasUser')
      .updateOne({ _id: new ObjectId(entry.id) }, {
        $set: Object.assign({}, entry, {
          id: undefined,
          phoneNumber: entry.phoneNumber,
          password: entry.password ? sha1(entry.password) : sha1(tempPassword),
          address_1: entry.address,
          city: entry.city,
        }),
      });
  }
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      {
        $set: Object.assign({}, entry, {
          id: undefined,
          phoneNumber: entry.phoneNumber,
          password: entry.password ? sha1(entry.password) : sha1(tempPassword),
          address_1: entry.address,
          city: entry.city,
        }),
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
