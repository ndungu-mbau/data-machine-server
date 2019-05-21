/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
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
import actions from './actions/action_map';
import emit from './actions/index';
import {
  passwordResetEmail,
  sendDocumentEmails,
  registrationThanks,
  accountActivationEmail,
  userLoggedIn,
  userCreatedAccount,
  appUserLoggedIn,
} from './emails/mailer';

import config from '../config';
import jobs from '../jobs';
import { bulkAdd } from './etl-pipeline';

const rateLimit = require('express-rate-limit');

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // start blocking after 5 requests
  message:
    'Too many accounts created from this IP, please try again after an hour',
});

const loginAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message: 'Too login attempts this IP, please try again after an hour',
});

const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

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

const {
  NODE_ENV = 'development',
  EMAIL_BASE,
  MASTER_TOKEN,
  DISABLE_JOBS = false,
} = process.env;

const multer = Multer({
  dest: 'uploads/',
});

let db;

function makeShortPassword() {
  let text = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 4; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

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
      // eslint-disable-next-line consistent-return
      if (emediate === true) {
        return work({ db, log });
      }

      if (NODE_ENV !== 'development' && !DISABLE_JOBS) {
        const task = cron.schedule(
          schedule,
          () => {
            try {
              work({ db, log });
            } catch (taskStartError) {
              log.info(
                `Job ${name} failed with error ${taskStartError.message}`,
              );
            }
          },
          options,
        );
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

app.options('*', cors());

app.use(cors(), bodyParser.urlencoded({ extended: false }), bodyParser.json());

if (NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

app.enable('trust proxy');

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
  // loginAccountLimiter,
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
        return res.send(
          Object.assign(userData, {
            password: undefined,
            token: jwt.sign(userData, config[NODE_ENV].hashingSecret),
          }),
        );
      }
      return res.status(401).send({ message: 'Passwords do not match' });
    }

    return res.status(401).send({ message: 'Account does not exist ' });
  },
);

app.post(
  '/auth/login_management',
  loginAccountLimiter,
  celebrate({
    body: Joi.object().keys({
      username: Joi.string()
        .required()
        .error(new Error('Please provide a username')),
      password: Joi.string()
        .required()
        .error(new Error('Please provide a password')),
    }),
  }),
  async (req, res) => {
    const { username, password } = req.body;
    const allowedAdmins = ['gitomehbranson@gmail.com', 'kuriagitome@gmail.com'];

    log.info('authenticating management', username);
    if (allowedAdmins.includes(username)) {
      log.info('authing a legit manager', username);
      const userData = await db.collection('user').findOne({ email: username });

      if (userData) {
        if (userData.password === sha1(password)) {
          appUserLoggedIn({
            to: 'info@braiven.io',
            data: {
              userData,
              phoneNumber: username,
            },
          });
          return res.send(
            Object.assign(userData, {
              password: undefined,
              token: jwt.sign(
                userData,
                config[NODE_ENV].managementHashingSecret,
              ),
            }),
          );
        }
        log.info('**** passwords did not match');

        log.info('**** user was not found on db');
      }

      return res
        .status(401)
        .send({ message: 'Wrong username and password combination' });
    }
    log.info('management username not found in users', username);
    return res.status(500).send('Unauthorised');
  },
);

app.post(
  '/saasAuth/login',
  loginAccountLimiter,
  celebrate({
    body: Joi.object().keys({
      email: Joi.string()
        .email()
        .required()
        .error(new Error('Please provide an valid email')),
      password: Joi.string()
        .required()
        .error(new Error('Please provide a password')),
    }),
  }),
  async (req, res) => {
    const { email, password } = req.body;

    const userData = await db.collection('user').findOne({ email });

    if (userData) {
      const saasUserData = await db
        .collection('user')
        // eslint-disable-next-line no-underscore-dangle
        .findOne({ _id: userData._id });

      if (userData.password === sha1(password)) {
        userLoggedIn({
          to: 'gitomehbranson@gmail.com',
          data: {
            email,
          },
        });
        return res.send(
          Object.assign(userData, {
            password: undefined,
            token: jwt.sign(saasUserData, config[NODE_ENV].hashingSecret),
          }),
        );
      }

      return res
        .status(401)
        .send({ message: 'Password provided does not match our records' });
    }

    return res.status(401).send({ message: 'Account does not exist' });
  },
);

app.post(
  '/saasAuth/requestResetPassword',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string()
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
        host:
          NODE_ENV === 'production'
            ? 'https://app.braiven.io'
            : 'http://localhost:3002',
      },
    });

    res.send();
    await db.collection('loginRequest').insertOne({
      _id: id,
      email,
      time: new Date(),
    });
  },
);

app.post('/saasAuth/checkUser', async (req, res) => {
  const { invitationId } = req.body;

  const { user: userEmail } = await db.collection('invitation').findOne({
    _id: new ObjectID(invitationId),
  });

  const user = await db.collection('user').findOne({
    email: userEmail,
  });

  if (!user) {
    res.status(404).send();
  } else {
    res.status(200).send();
  }
});

app.post('/saasAuth/activateInvitation/:id', async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;

  const { user: userEmail, client, name: userFirstName } = await db
    .collection('invitation')
    .findOne({
      _id: new ObjectID(id),
    });

  // check if the user exists and add the role to their account as admin
  const user = await db.collection('user').findOne({
    email: userEmail,
  });

  if (!user) {
    // create a user
    const legacyUser = {
      _id: new ObjectID(),
      firstName: userFirstName,
      password: sha1(password),
      email: userEmail,
      destroyed: false,
      userActivated: true,
    };

    // find the clients admin role
    const adminRole = await db.collection('role').findOne({
      clientId: new ObjectID(client),
      name: 'admin',
      destroyed: false,
    });

    // create a roleUser
    const user_role = {
      _id: new ObjectId(),
      role: adminRole._id,
      userId: legacyUser._id,
      destroyed: false,
    };

    await db.collection('user_roles').insertOne(user_role);

    await db.collection('user').insertOne(legacyUser);

    db.collection('invitation')
      .updateOne({
        user: userEmail,
        client,
      }, { $set: { destroyed: true } });
    res.send();
  } else {
    // find the clients admin role
    const adminRole = await db.collection('role').findOne({
      clientId: new ObjectID(client),
      name: 'admin',
      destroyed: false,
    });

    // create a roleUser
    const user_role = {
      _id: new ObjectId(),
      role: adminRole._id,
      userId: user._id,
      destroyed: false,
    };

    await db.collection('user_roles').insertOne(user_role);

    db.collection('invitation')
      .updateOne({
        user: userEmail,
        client,
      }, { $set: { destroyed: true } });

    res.send();
  }
});

app.post(
  '/saasAuth/resetPassword/:resetRequestId',
  celebrate({
    body: Joi.object().keys({
      password: Joi.string().required(),
      confirm: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    const { confirm, password } = req.body;
    const { resetRequestId } = req.params;

    if (confirm !== password) {
      res.status(401).send({ message: 'Password entries do not match' });
    }

    const requestData = await db
      .collection('loginRequest')
      .findOne({ _id: ObjectID(resetRequestId) });

    if (!requestData) {
      res.status(401).send({ message: 'Invalid password reset id' });
    }

    const userData = await db
      .collection('user')
      .find({ email: requestData.email });

    if (userData) {
      await db
        .collection('user')
        .updateOne(
          { email: requestData.email },
          { $set: { password: sha1(password) } },
        );
      return res.send();
    }

    return res.status(401).send({
      message:
        'We do not have the an account with the email you are trying to register to',
    });
  },
);

app.post(
  '/auth/register',
  createAccountLimiter,
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

    // ask for the country and use that here - then ask to confirm
    const number = phoneUtil.parseAndKeepRawInput(user.phoneNumber, 'KE');
    const coolNumber = phoneUtil.format(number, PNF.E164);

    // check if user already exists
    const userData = await db
      .collection('user')
      .findOne({ phoneNumber: user.phoneNumber });

    if (userData) {
      return res
        .status(401)
        .send({ message: 'Phone number already used, trying to log in?' });
    }

    const action = {
      topic: 'exec',
      cmd: 'sms_nalm_treasury_pwc_1',
      data: {
        password: user.password ? user.password : makeShortPassword(),
        phone: coolNumber,
      },
    };
    hemera.act(action, (err) => {
      if (err) {
        log.info('Error sending sms to ', user.phoneNumber, coolNumber, err);
      }
    });

    Object.assign(user, {
      _id: new ObjectId(),
      password: sha1(user.password),
      destroyed: false,
    });

    await db.collection('user').insertOne(user);
    return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) });
  },
);

const { getBrowserInstance } = require('./browserInstance');

const makeDashboardPdf = async (path, params, cb) => {
  const bookingUrl = `${
    NODE_ENV !== 'production'
      ? 'http://localhost:1234'
      : 'https://data-machine.braiven.io'
  }/dashboard.html#!/${params.q}/dashboard/${params.a}`;
  log.info(bookingUrl);
  try {
    await getBrowserInstance().then(async (browser) => {
      const page = await browser.newPage();
      // await page.setViewport({ width: 1920, height: 926 });
      await page.goto(bookingUrl);
      // eslint-disable-next-line no-shadow
      await page.evaluate((MASTER_TOKEN) => {
        // eslint-disable-next-line no-undef
        localStorage.setItem('auth2', MASTER_TOKEN);
      }, MASTER_TOKEN);
      await page.goto(bookingUrl, {
        // timeout: 5000,
        waitUntil: ['load', 'networkidle2'],
      });
      log.info('===>', 'saving the pdf', path);
      await page.pdf({
        path,
        format: 'A4',
        margin: {
          top: '100px',
          bottom: '100px',
        },
      });
      // call callback when we are sure
      cb();
    });
  } catch (err) {
    log.error('DOC_GEN_FAIL', err.message, { path, params });
    // return makePdf(path, params, cb)
  }
};

const makePdf = async (path, params, cb) => {
  const bookingUrl = `${
    NODE_ENV !== 'production'
      ? 'http://localhost:3002'
      : 'https://app.braiven.io'
  }/printable/questionnnaire/${params.q}/answer/${params.a}`;
  log.info(bookingUrl);
  try {
    await getBrowserInstance().then(async (browser) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 926 });
      await page.goto(bookingUrl);
      // eslint-disable-next-line no-shadow
      await page.evaluate((MASTER_TOKEN) => {
        // eslint-disable-next-line no-undef
        localStorage.setItem('token', MASTER_TOKEN);
      }, MASTER_TOKEN);
      await page.goto(bookingUrl, {
        timeout: 5000,
        waitUntil: ['load', 'networkidle2'],
      });
      await page.pdf({
        path,
        format: 'A4',
        margin: {
          top: '100px',
          bottom: '100px',
        },
      });
      cb();
    });
  } catch (err) {
    log.error('DOC_GEN_FAIL', err.message, { path, params });
    // return makePdf(path, params, cb)
  }
};

app.post('/submision', async (req, res) => {
  const submission = req.body;

  const Clients = db.collection('client');
  const Company = db.collection('company');
  const Users = db.collection('user');
  const Projects = db.collection('project');


  const [existingSubmission] = await db
    .collection('submision')
    .find({ completionId: submission.completionId })
    .toArray();

  if (existingSubmission) {
    return res.status(200).send({
      exists: true,
      // eslint-disable-next-line no-underscore-dangle
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

        const urlRoot = 'https://s3-us-west-2.amazonaws.com/questionnaireuploads/';
        const url = `${urlRoot}${submission.questionnaireId}_${key}_${
          submission.completionId
        }${ext ? `.${ext}` : ''}`;

        cleanCopy[key] = url;
      }
    }
  });

  // fetch data to patch to the submitted info
  // ---------------------
  const agentInfo = await Users.findOne({
    phoneNumber: cleanCopy.__agentPhoneNumber,
  });

  const projectInfo = await Projects.findOne({
    _id: new ObjectId(cleanCopy.projectId),
  });

  const clientInfo = await Clients.findOne({
    _id: new ObjectId(projectInfo.client),
  });

  const companyInfo = await Company.findOne({
    _id: new ObjectId(projectInfo.client),
  });

  // console.log(submision.__agentPhoneNumber, submision.client);

  // console.log(clientInfo, agentInfo, companyInfo);

  // add the following fields
  const newInfo = {
    __agentMetaData: agentInfo ? agentInfo.other : '',
    __clientName: clientInfo ? clientInfo.name : companyInfo.company_name,
    // eslint-disable-next-line no-underscore-dangle
    client: projectInfo.client,
    __projectName: projectInfo.name,
    userId: agentInfo ? new ObjectId(agentInfo._id) : null,
  };
  // ---------------------

  // save this info to the database as one large object
  const entry = Object.assign(
    {},
    cleanCopy,
    {
      _id: new ObjectID(),
      createdAt: new Date(),
      destroyed: false,
      // eslint-disable-next-line no-underscore-dangle
      userId: req.user ? req.user._id : undefined,
    },
    newInfo,
  );

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

  const [project] = await db
    .collection('project')
    .find({ _id: ObjectId(submission.projectId) })
    .toArray();

  const action = {
    topic: 'exec',
    cmd: questionnaire.name.replace(/\s/g, '_'),
    data: {
      submited,
      questionnaire,
      project,
    },
  };

  hemera.act(action, (err) => {
    if (err) {
      log.info('ERROR RUNNING SCRIPT');
    } else {
      log.info(`SUCCESSFULY RUN SCRIPT for ${submited._id}`);
    }
  });

  const { DISABLE_PDF_GENERATION } = process.env;

  // eslint-disable-next-line radix
  if (parseInt(DISABLE_PDF_GENERATION)) {
    log.info('*** DISABLE_PDF_GENERATION pdf generation is disabled, ');

    // eslint-disable-next-line consistent-return
    return;
  }

  // eslint-disable-next-line no-underscore-dangle
  const path = `./dist/${submited._id}.pdf`;

  return makePdf(
    path,
    {
      q: cleanCopy.questionnaireId,
      // eslint-disable-next-line no-underscore-dangle
      a: entry._id,
    },
    async () => {
      // --------fetch project details to make a nice project body --------------------
      // send only for nalm things
      if (submission.projectId === '5beab5708c9a406732c117a2') {
        // eslint-disable-next-line no-shadow
        const { __agentFirstName = '' } = entry;

        const upper = lower => lower.replace(/^\w/, c => c.toUpperCase());

        // eslint-disable-next-line no-underscore-dangle
        const ccPeople = [
          'anthony.njeeh@pwc.com',
          'nalm.nationaltreasury@gmail.com',
        ];

        try {
          const mailResponse = await sendDocumentEmails({
            from: `"National Treasury via Braiven Datakit " <${EMAIL_BASE}>`,
            // eslint-disable-next-line no-underscore-dangle
            to: cleanCopy.__agentEmail,
            cc: ccPeople.join(','),
            bcc: ['gitomehbranson@gmail.com', 'skuria@braiven.io'],
            subject: `'${project.name}' Submission`,
            message: `
          Dear ${upper(__agentFirstName.toLowerCase())},
          <br>
          <br>
          The submission for ${upper(
    project.name.toLowerCase(),
  )} is now ready for download as a pdf.
          <br>
          <br>
          Regards, The National Treasury
        `,
            attachments: [
              {
                // eslint-disable-next-line no-underscore-dangle
                filename: `${submited._id}.pdf`,
                content: fs.createReadStream(path),
                contentType: 'application/pdf',
              },
            ],
          });

          await db.collection('submision-emails').insertOne(mailResponse);
        } catch (err) {
          await db.collection('submision-email-failures').insertOne(err);
        }
      } else {
        const { __agentFirstName = '' } = entry;

        const upper = lower => lower.replace(/^\w/, c => c.toUpperCase());

        // eslint-disable-next-line no-underscore-dangle
        try {
          const mailResponse = await sendDocumentEmails({
            from: `"Braiven Datakit " <${EMAIL_BASE}>`,
            // eslint-disable-next-line no-underscore-dangle
            to: cleanCopy.__agentEmail,
            bcc: ['gitomehbranson@gmail.com', 'skuria@braiven.io'],
            subject: `'${project.name}' Submission`,
            message: `
          Dear ${upper(__agentFirstName.toLowerCase())},
          <br>
          <br>
          The submission for ${upper(
    project.name.toLowerCase(),
  )} is now ready for download as a pdf.
          <br>
          <br>
          Regards,
        `,
            attachments: [
              {
                // eslint-disable-next-line no-underscore-dangle
                filename: `${submited._id}.pdf`,
                content: fs.createReadStream(path),
                contentType: 'application/pdf',
              },
            ],
          });

          await db.collection('submision-emails').insertOne(mailResponse);
        } catch (err) {
          await db.collection('submision-email-failures').insertOne(err);
        }
      }
    },
  );
});

app.post('/resend_submission_action/:submissionId', async (req, res) => {
  log.info('regenerating document for ', req.params.submissionId);
  const entry = await db.collection('submision').findOne({
    _id: new ObjectID(req.params.submissionId),
  });

  log.info({ entry });

  if (!entry) {
    return res.status(404).send({ message: 'could not find the submission' });
  }

  log.info('found the document', req.params.submissionId);

  const path = `./dist/${entry._id}.pdf`;

  return makePdf(
    path,
    {
      q: entry.questionnaireId,
      a: req.params.submissionId,
    },
    async () => {
      // -----fetch project details to make a nice project body ---------
      const project = await db.collection('project').findOne({
        _id: new ObjectID(entry.projectId),
      });

      const { __agentFirstName = '' } = entry;

      const upper = lower => lower.replace(/^\w/, c => c.toUpperCase());

      let ccPeople;
      let bccPeople;
      let to;

      // eslint-disable-next-line no-underscore-dangle
      const { DISABLE_PDF_GENERATION } = process.env;

      // eslint-disable-next-line radix
      if (parseInt(Number(DISABLE_PDF_GENERATION))) {
        log.info('*** DISABLE_PDF_GENERATION pdf generation is disabled, ');
      }

      if (!req.body.real) {
        to = 'gitomehbranson@gmail.com';
        ccPeople = [];
        bccPeople = [];
      } else {
        to = entry.__agentEmail;
        ccPeople = ['anthony.njeeh@pwc.com', 'nalm.nationaltreasury@gmail.com'];
        bccPeople = ['gitomehbranson@gmail.com', 'skuria@braiven.io'];
      }

      const emailSendRes = await sendDocumentEmails({
        from: `"National Treasury via Braiven Datakit " <${EMAIL_BASE}>`,
        // eslint-disable-next-line no-underscore-dangle
        to,
        cc: ccPeople.join(','),
        bcc: bccPeople.join(','),
        subject: `'${project.name}' Submission`,
        message: `
      Dear ${upper(__agentFirstName.toLowerCase())},
      <br>
      <br>
      The submission for ${upper(
    project.name.toLowerCase(),
  )} is now ready for download as a pdf.
      <br>
      <br>
      Regards, The National Treasury
    `,
        attachments: [
          {
            // eslint-disable-next-line no-underscore-dangle
            filename: `${entry._id}.pdf`,
            content: fs.createReadStream(path),
            contentType: 'application/pdf',
          },
        ],
      });

      return res.status(200).send({
        emailSendRes,
      });
    },
  );
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
  await db.collection('settings').insertOne(settings);
  await db.collection('billing').insertOne(billing);
  await db.collection('saasUser').insertOne(user);

  await db.collection('company').insertOne(company);
  // await db.collection('client').insertOne(client);

  emit({ action: actions.SAAS_USER_CREATED, data: legacyUser });

  emit({ action: actions.CLIENT_CREATED, data: company });

  await bulkAdd({
    db,
    files: ['example_survey.json'],
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
    to: 'gitomehbranson@gmail.com',
    data: {
      email,
    },
  });
  // send out a sample project created email
  // send out a process guide email
  // send out a download our app email

  // start tracking this user for the next 30 days

  return {
    user: user.id,
    company: company.id,
    billing: billing.id,
    settings: settings.id,
    token: jwt.sign(user, config[NODE_ENV].hashingSecret),
  };
});

const registrationAction = {
  topic: 'registration',
  cmd: 'saas-registration',
};

hemera.add(
  registrationAction,
  args => new Promise(async (resolve, reject) => {
    const {
      password, email, contact, firstName, orgName,
    } = args.data;

    const userid = new ObjectID();

    const user = {
      _id: userid,
      email,
      phoneNumber: contact,
      firstName,
      destroyed: false,
    };

    const company = {
      _id: new ObjectID(),
      company_name: orgName,
      contact,
      createdBy: userid,
      destroyed: false,
    };

    const settings = {
      _id: user._id,
      user: user._id,
      destroyed: false,
    };

    const legacyUser = {
      _id: user._id,
      firstName: user.firstName,
      phoneNumber: user.phoneNumber,
      password: sha1(password),
      email: user.email,
      destroyed: false,
      client: company._id,
    };

    const activation = {
      _id: new ObjectId(),
      user: userid,
      destroyed: false,
    };

    // check for existing emails and throw errors
    const [existingUser] = await db
      .collection('user')
      .find({ email: user.email })
      .toArray();

    if (existingUser) {
      return reject(new Error('User with this email already exists'));
    }

    // before starting the db saving things, first reply as thins might take sometime
    resolve({
      user: user.id,
      settings: settings.id,
      token: jwt.sign(user, config[NODE_ENV].hashingSecret),
    });

    const role = {
      _id: new ObjectId(),
      clientId: company._id,
      name: 'admin',
      destroyed: false,
    };

    const user_role = {
      _id: new ObjectId(),
      role: role._id,
      userId: userid,
      destroyed: false,
    };

    // create base data
    await db.collection('user').insertOne(legacyUser);
    await db.collection('role').insertOne(role);
    await db.collection('user_roles').insertOne(user_role);
    await db.collection('company').insertOne(company);
    await db.collection('activation').insertOne(activation);

    await bulkAdd({
      db,
      files: ['example_survey.json'],
      client: company._id.toString(),
      user: user._id.toString(),
    });

    // send out a welcome email
    registrationThanks({
      to: user.email,
      data: Object.assign({}, legacyUser, {
        company: {
          name: user.firstName,
        },
      }),
    });

    accountActivationEmail({
      to: user.email,
      data: Object.assign({}, legacyUser, {
        id: legacyUser._id,
        host:
          NODE_ENV === 'production'
            ? 'https://app.braiven.io'
            : 'http://localhost:3000',
      }),
    });

    return userCreatedAccount({
      to: 'gitomehbranson@gmail.com',
      data: {
        email,
      },
    });
    // send out a sample project created email
    // send out a process guide email
    // send out a download our app email
  }),
);

hemera.add(
  {
    topic: 'registration',
    cmd: 'activate-account-check',
  },
  async (args) => {
    const { id } = args;

    const [activation] = await db
      .collection('activation')
      .find({ user: new ObjectId(id), destroyed: false })
      .toArray();

    if (!activation) {
      throw new Error('Invalid activation details');
    }

    return true;
  },
);

hemera.add(
  {
    topic: 'registration',
    cmd: 'activate-account',
  },
  async (args) => {
    const {
      id,
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

    const userid = new ObjectID(id);

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
    };

    // check for existing emails and throw errors
    /* const [existingUser] = await db
    .collection('user')
    .find({ email: user.email })
    .toArray();

  if (existingUser) {
    throw new Error('User with this email already exists');
  } */

    // create base data
    await db
      .collection('user')
      .updateOne({ _id: userid }, { $set: legacyUser });
    await db
      .collection('settings')
      .updateOne({ id: settings._id }, { $set: settings });
    await db
      .collection('company')
      .updateOne({ _id: company_contact._id }, { $set: company });

    await db.collection('billing').insertOne(billing);
    await db.collection('saasUser').insertOne(user);

    /* registrationThanks({
    to: user.email,
    data: Object.assign({}, legacyUser, {
      company: {
        name: company.company_name,
      },
    }),
  });

  userCreatedAccount({
    to: 'gitomehbranson@gmail.com',
    data: {
      email,
    },
  }); */
    // send out a sample project created email
    // send out a process guide email
    // send out a download our app email

    // start tracking this user for the next 30 days

    return {
      user: user.id,
      company: company.id,
      billing: billing.id,
      settings: settings.id,
      token: jwt.sign(user, config[NODE_ENV].hashingSecret),
    };
  },
);

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
  // eslint-disable-next-line max-len
  Object.keys(weeks).map(async weekKey => Object.keys(weeks[weekKey].daysInWeek).map(async (day) => {
    promises.push(
      new Promise(async (resolve) => {
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
      }),
    );
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

  // eslint-disable-next-line no-restricted-syntax
  for (const x in Object.values(days)) {
    /* eslint-disable-line no-restricted-syntax */
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
        .find(
          Object.assign({}, req.body, {
            completedAt,
          }),
        )
        .toArray();

      day = {
        start: startTime,
        end: endTime,
        count: data.length,
        // attatch data thats used on the admin ui
        data: data.map(({ _id, GPS_longitude: long, GPS_latitude: lat }) => ({
          _id,
          long,
          lat,
        })),
      };
      info[x] = day;
    }
  }

  res.send(info);
});

app.get('/submisions/:questionnaireId', async (req, res) => {
  // try {
  const {
    showComputed = true,
    showCompounded = true,
    filters = [],
  } = req.query;

  const submission = req.params;
  const { questionnaireId } = submission;

  const compoundedProps = [];
  const computedProps = [];

  const dashboards = await db
    .collection('dashboard')
    .find({ questionnaire: questionnaireId, destroyed: false })
    .toArray();

  const data = await Promise.all(
    dashboards.map(async dashboard => Promise.all([
      db
        .collection('cpd')
        .find({ dashboard: dashboard._id.toString(), destroyed: false })
        .toArray(),
      db
        .collection('cp')
        .find({ dashboard: dashboard._id.toString(), destroyed: false })
        .toArray(),
    ])),
  );

  // extract all the cps'd and cpds
  data.map((dashboard) => {
    const [cpds, cps] = dashboard;
    if (cpds) compoundedProps.push(...cpds);

    if (cps) computedProps.push(...cps);
  });

  const submisions = await db
    .collection('submision')
    .find({ questionnaireId })
    .toArray();

  // fetch all involved emails at once, put them on a map and map them out
  const involvedUsers = await db
    .collection('user')
    .find({
      phoneNumber: { $in: submisions.map(sub => sub.__agentPhoneNumber) },
    })
    .toArray();

  const userMap = {};

  // eslint-disable-next-line array-callback-return
  involvedUsers.map((user) => {
    userMap[user.phoneNumber] = user;
  });

  submisions.map((row) => {
    if (userMap[row.__agentPhoneNumber]) {
      // eslint-disable-next-line no-param-reassign
      row.__agentMetaData = userMap[row.__agentPhoneNumber].other;
    }
    return submisions;
  });

  let computed = submisions.map((row) => {
    const copyRecord = {};
    computedProps.forEach((form) => {
      const tempFn = doT.template(form.formular || '');
      const resultFormular = tempFn(row);

      log.info('running compoundedProps eval on computed', {
        formular: form.formular,
        resultFormular,
      });

      let calcRes;
      try {
        const mathRes = math.eval(resultFormular);
        calcRes = Math.round(Number(mathRes) * 100) / 100;
      } catch (err) {
        calcRes = null;
      }

      copyRecord[form.name] = calcRes;
    });
    Object.assign(copyRecord, row);

    copyRecord._id = copyRecord._id.toString();
    return copyRecord;
  });

  // filter the computed props here if need be
  // eslint-disable-next-line no-restricted-syntax
  for (const x in filters) {
    // eslint-disable-next-line no-prototype-builtins
    if (filters.hasOwnProperty(x)) {
      const filter = filters[x];
      computed = computed.filter((sub) => {
        if (filter.sign === 'eq') {
          console.log(sub, filter.input, sub[filter.input], filter.value);
          // eslint-disable-next-line eqeqeq
          return sub[filter.input] == filter.value;
        }

        if (filter.sign === 'not eq') {
          console.log(sub, filter.input, sub[filter.input], filter.value);
          // eslint-disable-next-line eqeqeq
          return sub[filter.input] != filter.value;
        }
      });
      return;
    }
  }

  console.log({ computed: computed.length });

  const compounded = {};
  compoundedProps.forEach((c) => {
    if (c.type === 'formular') {
      const tempFn = doT.template(c.formular);
      const resultFormular = tempFn(compounded);

      log.info('running compoundedProps eval on computed', {
        formular: c.formular,
        resultFormular,
      });

      let calcRes;
      try {
        const mathRes = math.eval(resultFormular);
        calcRes = Math.round(Number(mathRes) * 100) / 100;
      } catch (err) {
        // set this to 0
        calcRes = 0;
      }

      compounded[c.name] = calcRes;
      return;
    }

    let values = computed.filter(row => row[c.field]).map(row => row[c.field]);

    // const result = math[c.type](values);
    let result;
    // check for various types to be able to support weird ones like count... thats if we need size
    if (c.type !== 'count') {
      // chek for a filter and run it if exists
      if (c.filter !== undefined) {
        if (c.filter === '=') {
          values = values.filter(v => v === c.filterValue);
        }
        // other filters here
      }

      result = math[c.type](values);
    } else {
      if (c.filter !== undefined) {
        if (c.filter === '=') {
          values = values.filter(v => v === c.filterValue);
        }
        // other filters here
      }

      result = submisions.length;
    }

    compounded[c.name] = typeof result === 'object' ? result[0] : result;
  });

  return res.send(Object.assign(
    {},
    // eslint-disable-next-line eqeqeq
    Boolean(showCompounded) == true ? { compounded } : { compounded: [] },
    // eslint-disable-next-line eqeqeq
    Boolean(showComputed) == true ? { computed } : { computed: [] },
    { filters },
  ));
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

app.get(
  '/printable/:q/:a',
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    const path = `./dist/${req.params.a}.pdf`;

    await makePdf(path, req.params, async () => {
      res.setHeader('content-type', 'some/type');
      fs.createReadStream(`./dist/${req.params.a}.pdf`).pipe(res);
    });
  },
);

app.get(
  '/printableDash/:q/:d',
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    const path = `./dist/${req.params.d}.pdf`;

    await makeDashboardPdf(path, req.params, async () => {
      res.setHeader('content-type', 'some/type');
      fs.createReadStream(`./dist/${req.params.d}.pdf`).pipe(res);
    });
  },
);

app.use(errors());

export default app;
