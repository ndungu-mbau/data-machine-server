/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable no-underscore-dangle */
const _email = async (x) => {
  const flags = [];

  if (x === '') {
    flags.push({
      message: 'blank',
    });
  }

  return {
    _email_flags: flags,
  };
};

const _firstname = async (x) => {
  const flags = [];

  if (x === '') {
    flags.push({
      message: 'blank',
    });
  }

  return {
    _firstname_flag: flags,
  };
};

const _middlename = async (x) => {
  const flags = [];

  if (x === '') {
    flags.push({
      message: 'blank',
    });
  }

  return {
    _middlename_flag: flags,
  };
};

const _lastname = async (x) => {
  const flags = [];

  if (x === '') {
    flags.push({
      message: 'blank',
    });
  }

  return {
    _lastname_flag: flags,
  };
};

export default {
  name: 'NEW_USER',
  schedule: '* * * * *',
  emediate: false,
  async work({ db }) {
    // first store all validations on a map for access when running
    const validationsMap = {};
    const users = await db.collection('user').find({}).toArray();
    // eslint-disable-next-line camelcase
    const user_validations = await db.collection('user_validation').find({}).toArray();

    user_validations.forEach((val) => { validationsMap[val.email] = val; });

    for (const i in users) {
      const user = users[i];

      const {
        email,
        firstName,
        middleName,
        lastName,
      } = user;

      if (!email) {
        return;
      }

      const issues = {};

      Object.assign(
        issues,
        // eslint-disable-next-line no-await-in-loop
        await _email(email),
        // eslint-disable-next-line no-await-in-loop
        await _firstname(firstName),
        // eslint-disable-next-line no-await-in-loop
        await _middlename(middleName),
        // eslint-disable-next-line no-await-in-loop
        await _lastname(lastName),
      );

      await db
        .collection('user_validation')
        .updateOne(
          { email },
          { $set: issues },
          { upsert: true },
        );
    }
  },
  opts: {
    schedule: true,
  },
};
