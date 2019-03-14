import express from 'express';
import morgan from 'morgan';
import sha1 from 'sha1';
import { celebrate, Joi, errors } from 'celebrate';
import jwt from 'jsonwebtoken';
import Multer from 'multer';
import config from '../config';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import AWS from 'aws-sdk';
import parser from './parser';
import { MongoClient, ObjectId } from 'mongodb';
import cron from 'node-cron';
import {
  passwordResetEmail,
  sendDocumentEmails,
  registrationThanks,
  accountActivationEmail,
  userLoggedIn,
  userCreatedAccount,
  appUserLoggedIn,
} from './emails/mailer';
import jobs from '../jobs';
import { bulkAdd } from './etl-pipeline';

const rateLimit = require("express-rate-limit");


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // start blocking after 5 requests
  message:
    "Too many accounts created from this IP, please try again after an hour"
});

const loginAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message:
    "Too login attempts this IP, please try again after an hour"
});


const PNF = require('google-libphonenumber').PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const moment = require('moment');
const doT = require('dot');
const math = require('mathjs');
const puppeteer = require('puppeteer');

const { ObjectID } = require('mongodb');

const Hemera = require('nats-hemera');
const nats = require('nats').connect({
  url: process.env.NATS_URL,
});

const hemera = new Hemera(nats, {
  logLevel: 'silent',
});

AWS.config.loadFromPath('aws_config.json');

const { NODE_ENV = 'development', DISABLE_JOBS = false } = process.env;

const multer = Multer({
  dest: 'uploads/',
});

let db;

function makeShortPassword() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

MongoClient.connect(
  config[NODE_ENV].db.url,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) throw err;
    db = client.db(config[NODE_ENV].db.name);

    // start the jobs, give access to the db instance
    jobs.map(({
      name, schedule, work, options, emediate,
    }) => {
      if (emediate === true) {
        work({ db });
      }

      if (NODE_ENV !== 'development' && !DISABLE_JOBS) {
        const task = cron.schedule(schedule, () => {
          try {
            work({ db });
          } catch (err) {
            console.log(`Job ${name} failed with error ${err.message}`);
          }
        }, options);
        task.start();
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

app.use(morgan('combined'));
//  apply to all requests
// app.use(limiter);
app.enable("trust proxy");

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

  // console.log(JSON.stringify({ weeks }, null, '\t'))
  return weeks;
};

const getDayBreakDown = ({ start, end }) => {
  const now = start;
  const then = end;

  const dayCountDays = {};

  // const x = moment(now).diff(moment(then))
  const dayNumber = moment(then).diff(moment(now), 'days');

  let currentDay;
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
  loginAccountLimiter,
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
    const allowedAdmins = ['sirbranson67@gmail.com', 'kuriagitomeh@gmail.com']

    console.log("authenticating management", username)
    if (allowedAdmins.includes(username)) {
      console.log("authing a legit manager", username)
      const userData = await db
        .collection('user')
        .findOne({ email: username });

      if (userData) {
        if (userData.password === sha1(password)) {
          appUserLoggedIn({
            to: 'info@braiven.io',
            data: {
              userData,
              phoneNumber: username,
            },
          });
          return res.send(Object.assign(userData, {
            password: undefined,
            token: jwt.sign(userData, config[NODE_ENV].managementHashingSecret),
          }));
        }
      }

      return res
        .status(401)
        .send({ message: 'Wrong username and password combination' });
    }
    console.log("management username not found in users", username)
    return res.status(500).send("Unauthorised")
  },
);

app.post(
  '/saasAuth/login',
  loginAccountLimiter,
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
            saasUserData
            , config[NODE_ENV].hashingSecret,
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
    const coolNumber = phoneUtil.format(number, PNF.E164)

    // check if user already exists
    const userData = await db
      .collection('user')
      .findOne({ phoneNumber: coolNumber });

    // console.log({ userData })
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
        phone: coolNumber
      },
    };
    hemera.act(action, (err, resp) => {
      if (err) {
        console.log("Error sending sms to ", user.phoneNumber, coolNumber, err)
      }
    });

    Object.assign(user, {
      _id: new ObjectId(),
      password: sha1(user.password),
      phoneNumber: coolNumber,
      destroyed: false,
    });

    await db.collection('user').insertOne(user);

    return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) });
  },
);

const launchOptions = {
  headless: true,
  pipe: true,
  args: ['--headless', '--disable-gpu', '--full-memory-crash-report', '--unlimited-storage',
    '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
}

let browser; 

puppeteer.launch(launchOptions).then(Ibrowser => browser = Ibrowser);

const lauchNewInstance = async () => {
  console.log("launching new browser")
  browser = await puppeteer.launch(launchOptions);

  browser.on('disconnected', async () => {
    lauchNewInstance()
  });
}

browser.on('disconnected', async () => {
  lauchNewInstance()
});


const makePdf = async (path, params) => {
  const { MASTER_TOKEN, NODE_ENV } = process.env;
  const bookingUrl = `${NODE_ENV !== 'production' ? 'http://localhost:3000' : 'https://app.braiven.io'}/printable/questionnnaire/${params.q}/answer/${params.a}`;
  console.log(bookingUrl);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 926 });
  await page.goto(bookingUrl);
  await page.evaluate((MASTER_TOKEN) => {
    localStorage.setItem('token', MASTER_TOKEN);
  }, MASTER_TOKEN);
  await page.goto(bookingUrl, { waitUntil: 'networkidle0' });
  console.log('===>', 'saving the pdf');
  await page.pdf({
    path,
    format: 'A4',
    margin: {
      top: "100px",
      bottom: "100px"
    }
  });
}

app.post('/submision', async (req, res) => {
  const submission = req.body;

  // console.log(JSON.stringify({ submission }, null, '\t'));

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
  // find the files and use they data in the url to generate the url
  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value === false) {
        cleanCopy[key] = 0;
        return;
      }

      if (moment(value, moment.ISO_8601, true).isValid()) {
        cleanCopy[key] = moment(value).toDate();
        return;
      }

      cleanCopy[
        key
          .replace(/\s+/g, '_')
          .split('.')
          .join('_')
      ] = value;
    }
  });


  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value.toString().includes('file://')) {
        const [, ext] = value.split('.');

        cleanCopy[
          key
        ] = `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${
          submission.questionnaireId
          }_${key}_${submission.completionId}${ext ? `.${ext}` : ''}`;

        console.log('=====>', cleanCopy[key]);
      }
    }
  });
  console.log(JSON.stringify({ cleanCopy }, null, '\t'));


  const entry = Object.assign({}, cleanCopy, {
    _id: new ObjectID(),
    createdAt: new Date(),
    destroyed: false,
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

  hemera.act(action, (err, resp) => {
    if (err) {
      console.log('ERROR RUNNING SCRIPT');
    } else {
      console.log(`SUCCESSFULY RUN SCRIPT for ${submited._id}`);
    }
  });

  const path = `./dist/${submited._id}.pdf`

  await makePdf(path, {
    q: cleanCopy.questionnaireId,
    a: entry._id
  })

  // -------------------------------fetch project details to make a nice project body --------------------
  const project = await db.collection('project').findOne({
    _id: new ObjectID(entry.projectId)
  });

  const {
    __agentFirstName = '',
    __agentLastName = '',
    __agentMiddleName = ''
  } = entry

  const upper = (lower) => lower.replace(/^\w/, c => c.toUpperCase());

  const ccPeople = ['kuriagitome@gmail.com', cleanCopy.__agentEmail]
  sendDocumentEmails({
    from: `"${upper(__agentFirstName.toLowerCase())} ${upper(__agentMiddleName.toLowerCase())} ${upper(__agentLastName.toLowerCase())} via Datakit " <${process.env.EMAIL_BASE}>`,
    to: 'sirbranson67@gmail.com',
    cc: ccPeople.join(","),
    subject: `'${project.name}' Submission`,
    message: `
      My ${upper(project.name.toLowerCase())} submission for is now ready for download as a pdf.
      <br>
      <br>

      Please find the document attached to this email.
      <br>
      <br>
      Regards,
    `,
    attachments: [{
      filename: `${submited._id}.pdf`,
      content: fs.createReadStream(path),
      contentType: 'application/pdf'
    }]
  })
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
    address_2,
    city,
    state,
    zip,
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

  const client = {
    _id: new ObjectID(),
    name: company_name,
    contact,
    createdBy: userid,
    destroyed: false,
  };

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

  /* const questionnaire = {
    _id: new ObjectID(),
    name: 'Sample questionnaire',
    client: company._id.toString(),
    destroyed: false,
  };

  const project = {
    _id: new ObjectID(),
    name: 'Sample project',
    client: company._id.toString(),
    questionnaire: questionnaire._id,
    destroyed: false,
  };

  const team = {
    _id: new ObjectID(),
    name: 'Sample team',
    client: company._id.toString(),
    destroyed: false,
  };

  const project_team = {
    project: project._id.toString(),
    team: team._id.toString(),
    destroyed: false,
  };

  const user_teams = {
    user: user._id.toString(),
    team: team._id.toString(),
    destroyed: false,
  };

  await db.collection('project').insertOne(project);
  await db.collection('team').insertOne(team);
  await db.collection('questionnaire').insertOne(questionnaire);
  await db.collection('project_teams').insertOne(project_team);
  await db.collection('user_teams').insertOne(user_teams);

  const page = {
    _id: new ObjectID(),
    name: 'Sample page',
    questionnaire: questionnaire._id.toString(),
    destroyed: false,
  };

  // create questionnire things
  await db.collection('page').insertOne(page);

  const group = {
    _id: new ObjectID(),
    name: 'Sample group',
    page: page._id.toString(),
    destroyed: false,
  };

  // create questionnire things
  await db.collection('group').insertOne(group);

  const question = {
    _id: new ObjectID(),
    type: 'instruction',
    placeholder: 'Sample instruction',
    group: group._id.toString(),
    destroyed: false,
  };

  // create questionnire things
  await db.collection('question').insertOne(question); */

  await bulkAdd({
    db,
    files: ['job-sheet.json'],
    client: company._id.toString(),
    user: user._id.toString()
  })

  // create a project, a team, a user, a team_user, a project_team, a questionnaire, page, group, question, dashboard, chart, cp, cds, constant, layout
  // and stitch them together to create a login setupp experience for the user

  // console.log({
  //   user: user._id,
  //   company: company._id,
  //   billing: billing._id,
  //   settings: settings._id
  // });

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
  // send out a sample project created email
  // send out a process guide email
  // send out a download our app email

  // start tracking this user for the next 30 days

  return {
    user: user.id,
    company: company.id,
    billing: billing.id,
    settings: settings.id,
    token: jwt.sign(
      user
      , config[NODE_ENV].hashingSecret,
    ),
  };
});

const registrationAction = {
  topic: 'registration',
  cmd: 'saas-registration',
};

hemera.add(registrationAction, async (args) => {
  const {
    password,
    email,
    contact,
    firstName,
    orgName
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
    destroyed: false
  }
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
  await db.collection('company').insertOne(company)
  await db.collection('activation').insertOne(activation)

  await bulkAdd({
    db,
    files: ['job-sheet.json'],
    client: company._id.toString(),
    user: user._id.toString(),
  })

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
      host: process.env.NODE_ENV === 'production'
        ? 'https://app.braiven.io'
        : 'http://localhost:3000',
    })
  })

  userCreatedAccount({
    to: 'sirbranson67@gmail.com',
    data: {
      email,
    },
  });
  // send out a sample project created email
  // send out a process guide email
  // send out a download our app email

  return {
    user: user.id,
    settings: settings.id,
    token: jwt.sign(
      user
      , config[NODE_ENV].hashingSecret,
    ),
  };
});

hemera.add({
  topic: 'registration',
  cmd: 'activate-account-check'
}, async (args) => {
  const { id } = args

  const [activation] = await db.collection('activation').find({ user: new ObjectId(id), destroyed: false }).toArray()

  if (!activation) {
    throw new Error('Invalid activation details')
  }

  return true
})

hemera.add({
  topic: 'registration',
  cmd: 'activate-account'
}, async (args) => {
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
    address_2,
    city,
    state,
    zip,
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

  const client = {
    _id: new ObjectID(),
    name: company_name,
    contact,
    createdBy: userid,
    destroyed: false,
  };

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
  /*const [existingUser] = await db
    .collection('user')
    .find({ email: user.email })
    .toArray();

  if (existingUser) {
    throw new Error('User with this email already exists');
  }*/

  // create base data
  await db.collection('user').updateOne({ _id: userid }, { $set: legacyUser })
  await db.collection('settings').updateOne({ id: settings._id }, { $set: settings });
  await db.collection('company').updateOne({ _id: company_contact._id }, { $set: company });

  await db.collection('billing').insertOne(billing);
  await db.collection('saasUser').insertOne(user);

  /*registrationThanks({
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
  });*/
  // send out a sample project created email
  // send out a process guide email
  // send out a download our app email

  // start tracking this user for the next 30 days

  return {
    user: user.id,
    company: company.id,
    billing: billing.id,
    settings: settings.id,
    token: jwt.sign(
      user
      , config[NODE_ENV].hashingSecret,
    ),
  };
})

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
  const action = {
    topic: 'exec',
    cmd: req.params.name,
    data: req.body,
  };
  hemera.act(action, (err, resp) => {
    if (err) {
      return res.status(500).send({ name: err.name, message: err.message });
      // return res.status(500).send(err)
    }
    res.send(resp);
  });
});

app.get('/submision/breakDown/:days', auth, async (req, res) => {
  const { days = 30 } = req.params;
  const weeks = getWeekBreakDown(days);

  const { phoneNumber } = req.user;

  const promises = [];
  Object.keys(weeks).map(async weekKey => Object.keys(weeks[weekKey].daysInWeek)
    .map(async (day) => {
      promises.push(new Promise(async (resolve, reject) => {
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

  residue.map((x) => {
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

  const randomCount = ({ min = 0, max = 10 }) => {
    // and the formula is:
    const random = Math.floor(Math.random() * (max - min + 1)) + min;

    return random;
  };

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

      // console.log(JSON.stringify(req.body, null, "\t"))

      const data = await db /* eslint-disable-line no-await-in-loop */
        .collection('submision')
        .find(Object.assign({}, req.body, {
          completedAt,
        })).toArray();

      // console.log(completedAt, day, count,
      //   moment.duration(moment(completedAt.$gte).diff(moment(completedAt.$lte))).humanize()
      // )

      day = {
        start: startTime,
        end: endTime,
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
    computedProps.push(...cps);
  });

  const submisions = await db
    .collection('submision')
    .find({ questionnaireId })
    .toArray();

  const computed = submisions.map((row) => {
    const copyRecord = {};
    computedProps.map((form) => {
      const tempFn = doT.template(form.formular || '');
      // console.log('computed', { formular: form.formular });
      const resultFormular = tempFn(row);

      // console.log('computed', { resultFormular });

      copyRecord[form.name] = math.eval(resultFormular);
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
      return;
    }

    const values = computed
      .filter(row => row[c.field])
      .map(row => row[c.field]);
    const result = math[c.type](values);
    compounded[c.name] = typeof result === 'object' ? result[0] : result;
  });
  res.send({
    computed,
    compounded,
  });
  // } catch (err) {
  //   res.status(500).send({ err })
  // }
});

const lowLevelParser = (req, res) =>
  new Promise((resolve, rej) => {
    parser.parse(req, res, { dir: '/tmp' }, (fields, file) => {
      resolve({ fields, file });
    });
  });

const rename = (source, target) =>
  new Promise((resolve, reject) => {
    fs.rename(source, target, (err, res) => {
      err ? reject(err) : resolve();
    });
  });

const upload = (bucket, target) =>
  new Promise((resolve, reject) => {
    bucket.upload(target, (err, file) => {
      if (!err) {
        // console.log('upload successfull');
        resolve(file);
      } else {
        // console.log(err);
        reject(err);
      }
    });
  });

app.post(
  '/upload',
  multer.single('file'),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    // console.log(req.body);
    // console.log(req.file);

    const { questionnaire = '', tag = '', interviewId = '' } = req.body;
    const [, ext] = req.file.originalname.split('.');

    const Key = `${questionnaire}_${tag}_${interviewId}${ext ? `.${ext}` : ''}`;
    res.status(201).send({
      uri: `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${Key}`,
    });

    // upload and save link in db, accessible via /questionnaireId/id
    const s3 = new AWS.S3();
    const fileData = fs.readFileSync(req.file.path);

    const params = {
      Bucket: 'questionnaireuploads',
      Key,
      Body: fileData,
      ACL: 'public-read',
    };
    await s3.putObject(params).promise();
  },
);

app.get(
  '/printable/:q/:a',
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    const path = `./dist/${req.params.a}.pdf`

    await makePdf(path, req.params)

    res.setHeader('content-type', 'some/type');
    fs.createReadStream(`./dist/${req.params.a}.pdf`).pipe(res);
    const ccPeople = ['kuriagitome@gmail.com', 'muriithited@gmail.com']
    sendDocumentEmails({
      to: 'sirbranson67@gmail.com',
      cc: ccPeople.join(","),
      attachments: [{   // filename and content type is derived from path
        filename: `${req.params.a}.pdf`,
        content: fs.createReadStream(`./dist/${req.params.a}.pdf`),
        contentType: 'application/pdf'
      }]
    })
  },
);



app.use(errors());

export default app;

// hemera.add({
//   topic: 'printer',
//   cmd: 'printSubmission',
// }, async args => makeDoc(args));
