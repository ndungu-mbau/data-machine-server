/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */

import express from 'express';
import morgan from 'morgan';
import sha1 from 'sha1';
import { celebrate, Joi, errors } from 'celebrate';
import jwt from 'jsonwebtoken';
import Multer from 'multer';

import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import AWS from 'aws-sdk';
import { MongoClient, ObjectId } from 'mongodb';
import cron from 'node-cron';
import bunyan from 'bunyan';
import {
  passwordResetEmail,
  registrationThanks,
  userLoggedIn,
  userCreatedAccount,
  appUserLoggedIn,
} from './emails/mailer';

import config from '../config';
import jobs from '../jobs';
import { bulkAdd } from './etl-pipeline';

const moment = require('moment');
const doT = require('dot');
const math = require('mathjs');
const { ObjectID } = require('mongodb');

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: process.env.NATS_URL,
});

const log = bunyan.createLogger({ name: 'app' });

const hemera = new Hemera(nats, {
  logLevel: 'silent',
});

AWS.config.loadFromPath('aws_config.json');

const { NODE_ENV = 'development', DISABLE_JOBS = false } = process.env;

const multer = Multer({
  dest: 'uploads/',
});

let db;

MongoClient.connect(
  config[NODE_ENV].db.url,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) throw err;
    db = client.db(config[NODE_ENV].db.name);
    // eslint-disable-next-line array-callback-return
    jobs.forEach(({
      name, schedule, work, options, emediate,
      // eslint-disable-next-line consistent-return
    }) => {
      if (emediate === true) {
        return work({ db, log });
      }

      if (NODE_ENV !== 'development' && !DISABLE_JOBS) {
        const task = cron.schedule(schedule, () => {
          try {
            work({ db, log });
          } catch (taskStartError) {
            log.info(`Job ${name} failed with error ${taskStartError.message}`);
          }
        }, options);
        return task.start();
      }
    });
  },
);

hemera.ready();

const app = express();

const auth = (req, res, next) => {
  if (req.headers.auth) {
    req.user = jwt.verify(req.headers.auth, config[NODE_ENV].hashingSecret);
    next();
  } else {
    res.status(401).send({ message: 'You are not authorized' });
  }
};

app.use(
  cors(),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
);

if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

const getWeekBreakDown = (daysBack) => {
  const today = moment().toDate();

  function weeksBetween(d1, d2) {
    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
  }

  const weekNumber = weeksBetween(
    moment(today).subtract(daysBack, 'day'),
    today,
  );

  // loop by number of times subtracting date by
  // 6 each time to get the dates that start and end
  // the weeks between
  const weeks = {};

  let ctx = {};
  // eslint-disable-next-line no-plusplus
  for (let count = 1; count < weekNumber + 1; count++) {
    let start;
    const daysInWeek = {};

    if (!ctx.start) {
      start = moment().endOf('day');
    } else {
      start = ctx.end;
    }

    const end = moment(start)
      .subtract(6, 'day')
      .startOf('day');

    ctx = {
      start,
      end,
    };

    // get days between start and end
    let daysCtx = {};
    // eslint-disable-next-line no-plusplus
    for (let dayCount = 1; dayCount < 8; dayCount++) {
      let dayStart;

      if (!daysCtx.start) {
        dayStart = start;
      } else {
        dayStart = daysCtx.start;
      }

      daysCtx = {
        start: dayStart,
      };

      daysInWeek[dayCount] = {
        start: moment(dayStart).startOf('day'),
        end: moment(dayStart).endOf('day'),
      };

      daysCtx.start = moment(dayStart)
        .subtract(1, 'day')
        .startOf('day');
    }

    weeks[count] = {
      start,
      end,
      daysInWeek,
    };
  }

  return weeks;
};

const getDayBreakDown = ({ start, end }) => {
  const now = start;
  const then = end;

  const dayCountDays = {};

  const dayNumber = moment(then).diff(moment(now), 'days');

  // eslint-disable-next-line no-plusplus
  for (let count = 0; count < dayNumber + 1; count++) {
    const t = moment(end)
      .subtract(count, 'day')
      .startOf('day');


    dayCountDays[count] = moment(t);
  }

  return dayCountDays;
};

app.use('/health', (req, res) => res.send());

app.post(
  '/auth/login',
  celebrate({
    body: Joi.object().keys({
      phone: Joi.string()
        .required()
        .error(new Error('Please provide a phone number')),
      password: Joi.string()
        .required()
        .error(new Error('Please provide a password')),
    }),
  }),
  async (req, res) => {
    const { phone, password } = req.body;

    const userData = await db
      .collection('user')
      .findOne({ phoneNumber: phone });

    if (userData) {
      if (userData.password === sha1(password)) {
        appUserLoggedIn({
          to: 'skuria@braiven.io',
          data: {
            userData,
            phoneNumber: phone,
          },
        });
        appUserLoggedIn({
          to: 'info@braiven.io',
          data: {
            userData,
            phoneNumber: phone,
          },
        });
        return res.send(Object.assign(userData, {
          password: undefined,
          token: jwt.sign(userData, config[NODE_ENV].hashingSecret),
        }));
      }
    }

    return res
      .status(401)
      .send({ message: 'Wrong username and password combination' });
  },
);

app.post(
  '/saasAuth/login',
  celebrate({
    body: Joi.object().keys({
      email: Joi
        .string()
        .email()
        .required()
        .error(new Error('Please provide an valid email')),
      password: Joi
        .string()
        .required()
        .error(new Error('Please provide a password')),
    }),
  }),
  async (req, res) => {
    const { email, password } = req.body;

    const userData = await db
      .collection('user')
      .findOne({ email });

    if (userData) {
      const saasUserData = await db
        .collection('user')
        // eslint-disable-next-line no-underscore-dangle
        .findOne({ _id: userData._id });

      if (userData.password === sha1(password)) {
        userLoggedIn({
          to: 'sirbranson67@gmail.com',
          data: {
            email,
          },
        });
        return res.send(Object.assign(userData, {
          password: undefined,
          token: jwt.sign(
            saasUserData,
            config[NODE_ENV].hashingSecret,
          ),
        }));
      }
    }

    return res
      .status(401)
      .send({ message: 'Wrong username and password combination' });
  },
);

app.post(
  '/saasAuth/requestResetPassword',
  celebrate({
    body: Joi.object().keys({
      email: Joi
        .string()
        .email()
        .required(),
    }),
  }),
  async (req, res) => {
    const { email } = req.body;
    const id = new ObjectID();
    passwordResetEmail({
      to: email,
      data: {
        id,
        host: process.env.NODE_ENV === 'production'
          ? 'https://app.braiven.io'
          : 'http://localhost:3000',
      },
    });

    res.send();
    await db
      .collection('loginRequest')
      .insertOne({
        _id: id,
        email,
        time: new Date(),
      });
  },
);

app.post(
  '/saasAuth/resetPassword/:resetRequestId',
  celebrate({
    body: Joi.object().keys({
      password: Joi
        .string()
        .required(),
      confirm: Joi
        .string()
        .required(),
    }),
  }),
  async (req, res) => {
    const { confirm, password } = req.body;
    const { resetRequestId } = req.params;

    if (confirm !== password) {
      res.status(401)
        .send({ message: 'Password entries do not match' });
    }

    const requestData = await db
      .collection('loginRequest')
      .findOne({ _id: ObjectID(resetRequestId) });

    if (!requestData) {
      res.status(401)
        .send({ message: 'Invalid password reset id' });
    }

    const userData = await db
      .collection('user')
      .find({ email: requestData.email });

    if (userData) {
      await db
        .collection('user')
        .updateOne({ email: requestData.email }, { $set: { password: sha1(password) } });
      return res.send();
    }

    return res
      .status(401)
      .send({ message: 'We do not have the an account with the email you are trying to register to' });
  },
);

app.post(
  '/auth/register',
  celebrate({
    body: Joi.object().keys({
      password: Joi.string().required(),
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      middleName: Joi.string().required(),
      mobileMoneyNumber: Joi.string().required(),
      phoneNumber: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    const { body: user } = req;

    const userData = await db
      .collection('user')
      .findOne({ phoneNumber: user.phoneNumber });

    if (userData) {
      return res
        .status(401)
        .send({ message: 'Phone number already used, trying to log in?' });
    }

    Object.assign(user, {
      _id: new ObjectId(),
      password: sha1(user.password),
      destroyed: false,
    });

    await db.collection('user').insertOne(user);

    return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) });
  },
);

app.post('/submision', async (req, res) => {
  const submission = req.body;

  const [existingSubmission] = await db
    .collection('submision')
    .find({ completionId: submission.completionId })
    .toArray();

  if (existingSubmission) {
    return res.status(200).send({
      exists: true,
      _id: existingSubmission._id,
    });
  }

  const cleanCopy = {};

  // eslint-disable-next-line array-callback-return
  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value === false) {
        cleanCopy[key] = 0;
      }

      if (moment(value, moment.ISO_8601, true).isValid()) {
        cleanCopy[key] = moment(value).toDate();
      }

      cleanCopy[
        key
          .replace(/\s+/g, '_')
          .split('.')
          .join('_')
      ] = value;
    }
  });


  // eslint-disable-next-line array-callback-return
  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value.toString().includes('file://')) {
        const [, ext] = value.split('.');

        const url = `https://s3-us-west-2.amazonaws.com/questionnaireuploads/
        ${submission.questionnaireId}_
        ${key}_
        ${submission.completionId}
        ${ext ? `.${ext}` : ''}`;

        cleanCopy[
          key
        ] = url;
      }
    }
  });

  const entry = Object.assign({}, cleanCopy, {
    createdAt: new Date(),
    destroyed: false,
    // eslint-disable-next-line no-underscore-dangle
    userId: req.user ? req.user._id : undefined,
  });

  await db.collection('submision').insertOne(entry);

  const [submited] = await db
    .collection('submision')
    .find({ completionId: submission.completionId })
    .toArray();

  res.send({ _id: submited._id });

  const [questionnaire] = await db
    .collection('questionnaire')
    .find({ _id: ObjectId(submission.questionnaireId) })
    .toArray();

  const action = {
    topic: 'exec',
    cmd: questionnaire.name.replace(/\s/g, '_'),
    data: submited,
  };

  return hemera.act(action, (err) => {
    if (err) {
      log('ERROR RUNNING SCRIPT');
    } else {
      log(`SUCCESSFULY RUN SCRIPT for ${submited._id}`);
    }
  });
});

const action = {
  topic: 'registratin',
  cmd: 'saas',
};

hemera.add(action, async (args) => {
  const {
    password,

    membership,
    promotions,
    accept,

    card_holder_name,
    card_number,
    billing_card_exp_month,
    billing_card_exp_year,
    cvv,
    address_line_1,
    address_line_2,
    zip_code,
    billing_country,

    email,
    firstName,
    middleName,
    lastName,
    address_1,
    city,
    state,
    country,

    company_name,
    company_registration_id,
    company_email,
    company_contact,
    communications_email,
    communications_sms,
    contact,
  } = args.data;


  const userid = new ObjectID();
  const company = {
    _id: new ObjectID(),
    company_name,
    company_registration_id,
    company_email,
    company_contact,
    communications_email,
    communications_sms,
    contact,
    createdBy: userid,
    destroyed: false,
  };

  // const client = {
  //   _id: new ObjectID(),
  //   name: company_name,
  //   contact,
  //   createdBy: userid,
  //   destroyed: false,
  // };

  const user = {
    _id: userid,
    email,
    phoneNumber: contact,
    firstName,
    middleName,
    lastName,
    address_1,
    city,
    state,
    country,
    client: company.id,
    destroyed: false,
  };

  const settings = {
    _id: user._id,
    user: user._id,
    membership,
    promotions,
    accept,
    destroyed: false,
  };

  const billing = {
    _id: new ObjectID(),
    company: company._id,
    user: user._id,
    card_holder_name,
    card_number,
    billing_card_exp_month,
    billing_card_exp_year,
    cvv,
    address_line_1,
    address_line_2,
    zip_code,
    billing_country,
  };

  const legacyUser = {
    _id: user._id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    phoneNumber: company.contact,
    password: sha1(password),
    email: user.email,
    destroyed: false,
    client: company._id,
    userActivated: false,
  };

  const role = { companyId: legacyUser.client, UserId: legacyUser._id, role: 'admin' };

  // check for existing emails and throw errors
  const [existingUser] = await db
    .collection('user')
    .find({ email: user.email })
    .toArray();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // create base data
  await db.collection('user').insertOne(legacyUser);
  await db.collection('roles').insertOne(role);
  await db.collection('settings').insertOne(settings);
  await db.collection('billing').insertOne(billing);
  await db.collection('saasUser').insertOne(user);

  await db.collection('company').insertOne(company);
  // await db.collection('client').insertOne(client);

  await bulkAdd({
    files: ['job-sheet.json'],
    client: company._id.toString(),
  });

  // send out a welcome email
  registrationThanks({
    to: user.email,
    data: Object.assign({}, legacyUser, {
      company: {
        name: company.company_name,
      },
    }),
  });

  userCreatedAccount({
    to: 'sirbranson67@gmail.com',
    data: {
      email,
    },
  });

  return {
    user: user.id,
    company: company.id,
    billing: billing.id,
    settings: settings.id,
    token: jwt.sign(
      user,
      config[NODE_ENV].hashingSecret,
    ),
  };
});

app.get('/submision/:id', async (req, res) => {
  const submission = req.params;
  const { id } = submission;

  const [submision] = await db
    .collection('submision')
    .find({ _id: ObjectId(id) })
    .toArray();

  res.send(submision);
});

app.post('/query/:name', async (req, res) => {
  const remoteAction = {
    topic: 'exec',
    cmd: req.params.name,
    data: req.body,
  };
  hemera.act(remoteAction, (err, resp) => {
    if (err) {
      return res.status(500).send({ name: err.name, message: err.message });
      // return res.status(500).send(err)
    }
    return res.send(resp);
  });
});

app.get('/submision/breakDown/:days', auth, async (req, res) => {
  const { days = 30 } = req.params;
  const weeks = getWeekBreakDown(days);

  const { phoneNumber } = req.user;

  const promises = [];
  Object.keys(weeks).map(async weekKey => Object.keys(weeks[weekKey].daysInWeek)
    .map(async (day) => {
      promises.push(new Promise(async (resolve) => {
        const { start, end } = weeks[weekKey].daysInWeek[day];
        const submisions = await db
          .collection('submision')
          .find({
            createdAt: {
              $gte: start.toDate(),
              $lte: end.toDate(),
            },
            __agentPhoneNumber: phoneNumber,
          })
          .count();

        resolve({
          submisions,
          weekKey,
          day,
        });
      }));
    }));

  const residue = await Promise.all(promises);

  residue.forEach((x) => {
    weeks[x.weekKey].daysInWeek[x.day].completions = x.submisions;
  });
  res.send(weeks);
});

app.post('/submision/breakDayDown/:start/:end', auth, async (req, res) => {
  const { start, end } = req.params;
  const days = getDayBreakDown({
    start: new Date(start),
    end: new Date(end),
  });

  const info = {};

  for (const x in Object.values(days)) { /* eslint-disable-line no-restricted-syntax */
    if (Object.prototype.hasOwnProperty.call(Object.values(days), x)) {
      let day = Object.values(days)[x];
      const endTime = day.endOf('day').toDate();
      const startTime = day.startOf('day').toDate();

      const completedAt = {
        $gte: startTime,
        $lte: endTime,
      };

      const data = await db /* eslint-disable-line no-await-in-loop */
        .collection('submision')
        .find(Object.assign({}, req.body, {
          completedAt,
        })).toArray();

      day = {
        start,
        end,
        count: data.length,
        // attatch data thats used on the admin ui
        data: data.map(({ _id, GPS_longitude: long, GPS_latitude: lat }) => ({ _id, long, lat })),
      };
      info[x] = day;
    }
  }

  res.send(info);
});

app.get('/submisions/:questionnaireId', async (req, res) => {
  // try {
  const submission = req.params;
  const { questionnaireId } = submission;

  const compoundedProps = [];
  const computedProps = [];

  const dashboards = await db
    .collection('dashboard')
    .find({ questionnaire: questionnaireId, destroyed: false })
    .toArray();

  const data = await Promise.all(dashboards.map(async dashboard => [
    await db
      .collection('cpd')
      .find({ dashboard: dashboard._id.toString(), destroyed: false })
      .toArray(),
    await db
      .collection('cp')
      .find({ dashboard: dashboard._id.toString(), destroyed: false })
      .toArray(),
  ]));

  // extract all the cps'd and cpds
  data.map((dashboard) => {
    const [cpds, cps] = dashboard;
    compoundedProps.push(...cpds);
    return computedProps.push(...cps);
  });

  const submisions = await db
    .collection('submision')
    .find({ questionnaireId })
    .toArray();

  const computed = submisions.map((row) => {
    const copyRecord = {};
    computedProps.map((form) => {
      const tempFn = doT.template(form.formular || '');
      const resultFormular = tempFn(row);

      copyRecord[form.name] = math.eval(resultFormular);
      return copyRecord;
    });
    Object.assign(copyRecord, row);
    return copyRecord;
  });

  const compounded = {};
  compoundedProps.map((c) => {
    if (c.type === 'formular') {
      const tempFn = doT.template(c.formular);
      const resultFormular = tempFn(compounded);
      const compiled = math.eval(resultFormular);
      compounded[c.name] = compiled;
    }

    const values = computed
      .filter(row => row[c.field])
      .map(row => row[c.field]);
    const result = math[c.type](values);

    compounded[c.name] = typeof result === 'object' ? result[0] : result;
    return compounded[c.name];
  });
  return res.send({
    computed,
    compounded,
  });
  // } catch (err) {
  //   res.status(500).send({ err })
  // }
});

app.post(
  '/upload',
  multer.single('file'),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    const { questionnaire = '', tag = '', interviewId = '' } = req.body;
    const [, ext] = req.file.originalname.split('.');

    const Key = `${questionnaire}_${tag}_${interviewId}${ext ? `.${ext}` : ''}`;
    res.status(201).send({
      uri: `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${Key}`,
    });

    const s3 = new AWS.S3();
    const fileData = fs.readFileSync(req.file.path);

    const params = {
      Bucket: 'questionnaireuploads',
      Key,
      Body: fileData,
      ACL: 'public-read',
    };
    return s3.putObject(params).promise();
  },
);

app.use(errors());

export default app;
