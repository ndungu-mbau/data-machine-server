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
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];

  const number = phoneUtil.parseAndKeepRawInput(entry.phoneNumber, 'KE');
  const coolNumber = phoneUtil.format(number, PNF.E164)

  // check if there is an entry with that phoneNumber
  const existingUser = await db.collection(collection).findOne({ phoneNumber: coolNumber })
  if (existingUser) {
    existingUser.id = existingUser._id;
    console.log("User already exists,not sending sms ", coolNumber)
    return existingUser;
  } else {
    // ask for the country and use that here - then ask to confirm


    const tempPassword = makeShortPassword()

    const action = {
      topic: 'exec',
      cmd: 'sms_nalm_treasury_pwc_1',
      data: {
        password: entry.password ? entry.password : tempPassword,
        phone: coolNumber
      },
    };

    console.log(action)

    hemera.act(action, (err, resp) => {
      if (err) {
        console.log("Error sending sms to ", entry.phoneNumber, coolNumber, err)
      }
    });

    Object.assign(entry, {
      _id: new ObjectId(),
      phoneNumber: coolNumber,
      password: entry.password ? sha1(entry.password) : sha1(tempPassword),
      client: new ObjectId(entry.client),
      destroyed: false,
    });
    db.collection(collection).insertOne(entry);
    entry.id = entry._id;
    return entry;
  }
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  if (entry.password) {
    entry.password = sha1(entry.password);
  }

  if (entry.address || entry.contact || entry.phoneNumber) {
    db.collection('saasUser')
      .updateOne({ _id: new ObjectId(entry.id) }, {
        $set: Object.assign({}, entry, {
          id: undefined,
          phoneNumber: entry.phoneNumber,
          address_1: entry.address,
          city: entry.city
        })
      });

  }
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: Object.assign({}, entry, { id: undefined }) });
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: true } });
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
