import express from 'express'
import morgan from 'morgan'
import sha1 from 'sha1'
const app = express()
import { celebrate, Joi, errors } from 'celebrate';
const BodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
import nodemailer from "nodemailer"
import Multer from "multer"
import config from "../config";
import cors from 'cors'
import bodyParser from 'body-parser'


const {
    NODE_ENV = 'development',
    PORT = 4000,
    HOST = '0.0.0.0'
} = process.env

const multer = Multer({
    dest: '/tmp',
    // limits: {
    //   fileSize: 5 * 1024 * 1024 // no larger than 5mb
    // }
});

const datastore = config[NODE_ENV].gcloud.datastore();
const storage = config[NODE_ENV].gcloud.storage();

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



var expressMongoDb = require('express-mongo-db');
app.use(expressMongoDb(config[NODE_ENV].dbUrl, { useNewUrlParser: true }));

app.use(BodyParser.json());
app.use(morgan('tiny'))


app.use("/health", (req, res) => res.send())

app.post("/auth/login", celebrate({
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().min(8).required(),
    })
}), async (req, res) => {
    const { email, password } = req.body
    const collection = req.db.collection("Members")
    const user = await collection.findOne({ email })

    if (!user)
        return res.status(401).send({ message: "No user found for this account" })

    if (user.password === sha1(password)) {
        const token = jwt.sign({ email }, config[NODE_ENV].hashingSecret);
        return res.send({ token })
    }

    return res.status(401).send({ message: "Wrong username and password combination" })
})

app.post("/auth/register", celebrate({
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().min(8).required(),
    })
}), async (req, res) => {
    const { email, password } = req.body

    const collection = req.db.collection("Members")
    const user = await collection.findOne({ email })

    if (user)
        return res.status(401).send({ message: "Account already exists with this account" })

    await collection.insert({ email, password: sha1(password) })

    const token = jwt.sign({ email }, config[NODE_ENV].hashingSecret);
    return res.send({ token })
})


app.use(
    cors(),
    bodyParser.urlencoded({ extended: false }),
    bodyParser.json(),
    multer.single('file'),
    morgan('compact'),
);

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




var bucket = storage.bucket('questionnaire_submission_files');

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

app.post('/upload', async (req, res) => {
    // if there is a file in the body from the middleware ie when testing locally
    let form = {}

    if (req.file)
        Object.assign(form, {
            fields: req.body,
            file: req.file.path
        })

    // on cloud function call the low level parser to get the contents
    if (!req.file)
        form = await lowLevelParser(req, res)

    const { ext, interviewId } = form.fields

    await rename(form.file, `/tmp/${interviewId}.${ext}`)

    await upload(bucket, `/tmp/${interviewId}.${ext}`)
    res.json(`https://storage.googleapis.com/questionnaire_submission_files/${interviewId}.${ext}`);
});




export default app