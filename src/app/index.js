import express from 'express'
import morgan from 'morgan'
import sha1 from 'sha1'
import { celebrate, Joi, errors } from 'celebrate';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer"
import Multer from "multer"
import config from "../config";
import cors from 'cors'
import bodyParser from 'body-parser'
import fs from 'fs'
import parser from "./parser"
import { MongoClient, ObjectId } from "mongodb"

const {
    NODE_ENV = 'development',
    PORT = 4000,
    HOST = '0.0.0.0'
} = process.env

const multer = Multer({
    dest: 'uploads/'
});

let db;

MongoClient.connect(config[NODE_ENV].dbUrl, { useNewUrlParser: true }, function (err, client) {
    if (err) throw err
    db = client.db('databank')
})

// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: 'info@braiven.io',
        pass: 'a32357377'
    }
});

// setup e-mail data, even with unicode symbols
var mailOptions = {
    from: '"Credistat " <info@braiven.io>', // sender address (who sends)
};

const sendMail = ({ to, subject, message }) => new Promise((resolve, reject) => {
    mailOptions.to = to
    mailOptions.subject = subject
    mailOptions.html = message
    // send mail with defined transport object
    transporter.sendMail(mailOptions, async (error, info) => {
        console.log({ error, info })
        // async save the email send to our collection on google
        const emailSends = datastore.key('emailSends');

        await datastore.save({
            key: emailSends,
            data: Object.assign({}, { error }, info, { subject }, { message, triggedAt: new Date().toISOString() })
        });

        if (error)
            return reject(error);

        resolve(info)
    });
})

const app = express()

app.use(
    cors(),
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    multer.single('file'),
    morgan('combined')
);

app.use("/health", (req, res) => res.send())

app.post("/auth/login", celebrate({
    body: Joi.object().keys({
        phone: Joi.string().required(),
        password: Joi.string().required(),
    })
}), async (req, res) => {
    const { phone, password } = req.body

    const userData = await db.collection('users').findOne({ 'phoneNumber': phone })

    console.log(userData)
    if (userData) {
        if (userData.password === sha1(password))
            return res.send(Object.assign(userData, {
                password: undefined,
                token: jwt.sign(userData, config[NODE_ENV].hashingSecret)
            }))
    }

    return res.status(401).send({ message: "Wrong username and password combination" })
})

app.post("/auth/register", celebrate({
    body: Joi.object().keys({
        password: Joi.string().required(),
        email: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        middleName: Joi.string().required(),
        mobileMoneyNumber: Joi.string().required(),
        password: Joi.string().required(),
        phoneNumber: Joi.string().required(),
    })
}), async (req, res) => {
    const { body: user } = req

    // check if user already exists
    const userData = await db.collection('users').findOne({ 'phoneNumber': user.phoneNumber })

    // console.log({ userData })

    if (userData) {
        return res.status(401).send({ message: "Phone number already used, trying to log in?" })
    }

    user._id = new ObjectId();

    user.password = sha1(user.password)

    db.collection('users').insertOne(user)

    return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) })
})

app.post('/submision', async (req, res) => {
    const submission = req.body;

    const query = datastore
        .createQuery('submission')
        .filter('compleationId', '=', submission.compleationId);

    const existingSubmission = await datastore.runQuery(query);

    if (existingSubmission[0].length > 0) {
        return res.status(409).send({
            error:
                'A submission with that compleationId already exists, are you sure this compleation has not already been submitted to the server before?',
        });
    }

    const key = datastore.key('submission');
    await datastore.save({
        key,
        data: Object.assign({}, submission, {
            createdAt: new Date().toISOString(),
            destroyed: false,
            id: undefined,
        }),
    });

    const { id } = key;

    // send the emails here
    sendMail({
        to: "credistart@gmail.com",
        subject: `Notification of a completed interview ${id} at ${new Date().toLocaleString()}`,
        message: `
        A new interview has been completed, please view at <a href="http://sabekinstitute.co.ke/dashboard.html#!/interview=${id}">view</a>
        <hr>
        <pre>${JSON.stringify(submission, null, "\t")}</pre>
      `
    }).then(console.log).catch(console.log)

    return res.send({
        id,
    });
});

app.get('/submision/:id', async (req, res) => {
    const submission = req.params;
    const { id } = submission;

    const key = {
        kind: 'submission',
        path: ['submission', id],
        id,
    };

    const results = await datastore.get(key);

    res.send(results.pop());
});

const lowLevelParser = (req, res) => new Promise((resolve, rej) => {
    parser.parse(req, res, { dir: "/tmp" }, function (fields, file) {
        resolve({ fields, file })
    })
})

const rename = (source, target) => {
    return new Promise((resolve, reject) => {
        fs.rename(source, target, (err, res) => {
            err ? reject(err) : resolve();
        });
    });
};

const upload = (bucket, target) => {
    return new Promise((resolve, reject) => {
        bucket.upload(target, function (err, file) {
            if (!err) {
                console.log("upload successfull");
                resolve(file);
            } else {
                console.log(err);
                reject(err);
            }
        });
    });
};

app.post('/upload', multer.single('file'), async (req, res) => {
    console.log(req.body)
    console.log(req.file)
    res.status(201).send('success')
});


app.use(errors());

export default app