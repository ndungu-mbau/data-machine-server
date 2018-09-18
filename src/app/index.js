import express from 'express';
import morgan from 'morgan';
import sha1 from 'sha1';
import { celebrate, Joi, errors } from 'celebrate';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Multer from 'multer';
import config from '../config';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import AWS from 'aws-sdk';
import parser from './parser';
import { MongoClient, ObjectId } from 'mongodb';

AWS.config.loadFromPath('aws_config.json');

const {
  NODE_ENV = 'development',
  PORT = 4000,
  HOST = '0.0.0.0',
} = process.env;

const multer = Multer({
  dest: 'uploads/',
});

let db;

MongoClient.connect(config[NODE_ENV].db.url, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db(config[NODE_ENV].db.name);
});

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'info@braiven.io',
    pass: 'a32357377',
  },
});

// setup e-mail data, even with unicode symbols
const mailOptions = {
  from: '"Credistat " <info@braiven.io>', // sender address (who sends)
};

const sendMail = ({ to, subject, message }) => new Promise((resolve, reject) => {
  mailOptions.to = to;
  mailOptions.subject = subject;
  mailOptions.html = message;
  // send mail with defined transport object
  transporter.sendMail(mailOptions, async (error, info) => {
    console.log({ error, info });
    // async save the email send to our collection on google
    const emailSends = datastore.key('emailSends');

    await datastore.save({
      key: emailSends,
      data: Object.assign({}, { error }, info, { subject }, { message, triggedAt: new Date().toISOString() }),
    });

    if (error) { return reject(error); }

    resolve(info);
  });
});

const app = express();

app.use(
  cors(),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  morgan('combined'),
);

app.use('/health', (req, res) => res.send());

app.post('/auth/login', celebrate({
  body: Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required(),
  }),
}), async (req, res) => {
  const { phone, password } = req.body;

  const userData = await db.collection('user').findOne({ phoneNumber: phone });

  console.log(userData);
  if (userData) {
    if (userData.password === sha1(password)) {
      return res.send(Object.assign(userData, {
        password: undefined,
        token: jwt.sign(userData, config[NODE_ENV].hashingSecret),
      }));
    }
  }

  return res.status(401).send({ message: 'Wrong username and password combination' });
});

app.post('/auth/register', celebrate({
  body: Joi.object().keys({
    password: Joi.string().required(),
    email: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    middleName: Joi.string().required(),
    mobileMoneyNumber: Joi.string().required(),
    phoneNumber: Joi.string().required(),
  }),
}), async (req, res) => {
  const { body: user } = req;

  // check if user already exists
  const userData = await db.collection('user').findOne({ phoneNumber: user.phoneNumber });

  // console.log({ userData })
  if (userData) {
    return res.status(401).send({ message: 'Phone number already used, trying to log in?' });
  }

  Object.assign(user, {
    _id: new ObjectId(),
    password: sha1(user.password),
    destroyed: false,
  });

  await db.collection('user').insertOne(user);

  return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) });
});

app.post('/submision', async (req, res) => {
  const submission = req.body;

  const [existingSubmission] = await db.collection('submision').find({ completionId: submission.completionId }).toArray();

  if (existingSubmission) {
    return res.status(200).send({
      exists: true,
      _id: existingSubmission._id,
    });
  }

  // find the files and use they data in the url to generate the url
  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value.toString().includes('file://')) {
        const [, ext] = value.split('.');

        submission[key] = `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${submission.questionnaireId}_${key}.${ext}`;
      }
    }
  });


  await db.collection('submision').insertOne(Object.assign({}, submission, {
    createdAt: new Date().toISOString(),
    destroyed: false,
    id: undefined,
  }));

  // send the emails here
  // sendMail({
  //     to: "credistart@gmail.com",
  //     subject: `Notification of a completed interview ${id} at ${new Date().toLocaleString()}`,
  //     message: `
  //     A new interview has been completed, please view at <a href="http://sabekinstitute.co.ke/dashboard.html#!/interview=${id}">view</a>
  //     <hr>
  //     <pre>${JSON.stringify(submission, null, "\t")}</pre>
  //   `
  // }).then(console.log).catch(console.log)

  const [submited] = await db.collection('submision').find({ completionId: submission.completionId }).toArray();

  return res.send({ _id: submited._id });
});

app.get('/submision/:id', async (req, res) => {
  const submission = req.params;
  const { id } = submission;

  const [submision] = await db.collection('submision').find({ _id: ObjectId(id) }).toArray();

  res.send(submision);
});


app.get('/submisions/:questionnaireId', async (req, res) => {
  const submission = req.params;
  const { questionnaireId } = submission;

  const submisions = await db.collection('submision').find({ questionnaireId }).toArray();

  res.send(submisions);
});

const lowLevelParser = (req, res) => new Promise((resolve, rej) => {
  parser.parse(req, res, { dir: '/tmp' }, (fields, file) => {
    resolve({ fields, file });
  });
});

const rename = (source, target) => new Promise((resolve, reject) => {
  fs.rename(source, target, (err, res) => {
    err ? reject(err) : resolve();
  });
});

const upload = (bucket, target) => new Promise((resolve, reject) => {
  bucket.upload(target, (err, file) => {
    if (!err) {
      console.log('upload successfull');
      resolve(file);
    } else {
      console.log(err);
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
    console.log(req.body);
    console.log(req.file);

    const { questionnaire = '', tag = '' } = req.body;
    const [, ext] = req.file.originalname.split('.');

    res.status(201).send({ uri: `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${questionnaire}_${tag}${ext ? `.${ext}` : ''}` });

    // upload and save link in db, accessible via /questionnaireId/id
    const s3 = new AWS.S3();
    const fileData = fs.readFileSync(req.file.path);

    const params = {
      Bucket: 'questionnaireuploads',
      Key: `${questionnaire}_${tag}.${ext}`,
      Body: fileData,
      ACL: 'public-read',
    };
    await s3.putObject(params).promise();
  },
);


app.use(errors());

export default app;
