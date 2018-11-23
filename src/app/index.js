import express from "express";
import morgan from "morgan";
import sha1 from "sha1";
import { celebrate, Joi, errors } from "celebrate";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Multer from "multer";
import config from "../config";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import AWS from "aws-sdk";
import parser from "./parser";
import { MongoClient, ObjectId } from "mongodb";
const moment = require("moment");
var doT = require("dot");
const math = require("mathjs");

AWS.config.loadFromPath("aws_config.json");

const { NODE_ENV = "development" } = process.env;

const multer = Multer({
  dest: "uploads/"
});

let db;

MongoClient.connect(
  config[NODE_ENV].db.url,
  { useNewUrlParser: true },
  (err, client) => {
    if (err) throw err;
    db = client.db(config[NODE_ENV].db.name);
  }
);

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: "info@braiven.io",
    pass: "a32357377"
  }
});

// setup e-mail data, even with unicode symbols
const mailOptions = {
  from: '"Credistat " <info@braiven.io>' // sender address (who sends)
};

const sendMail = ({ to, subject, message }) =>
  new Promise((resolve, reject) => {
    mailOptions.to = to;
    mailOptions.subject = subject;
    mailOptions.html = message;
    // send mail with defined transport object
    transporter.sendMail(mailOptions, async (error, info) => {
      // console.log({ error, info });
      // async save the email send to our collection on google
      const emailSends = datastore.key("emailSends");

      await datastore.save({
        key: emailSends,
        data: Object.assign(
          {},
          { error },
          info,
          { subject },
          { message, triggedAt: new Date().toISOString() }
        )
      });

      if (error) {
        return reject(error);
      }

      resolve(info);
    });
  });

const app = express();

const auth = (req, res, next) => {
  if (req.headers.auth)
    req.user = jwt.verify(req.headers.auth, config[NODE_ENV].hashingSecret);

  next();
};

app.use(
  cors(),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  morgan("combined")
);

const getWeekBreakDown = daysBack => {
  var today = moment().toDate();

  function weeksBetween(d1, d2) {
    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
  }

  const weekNumber = weeksBetween(
    moment(today).subtract(daysBack, "day"),
    today
  );

  // loop by number of times subtracting date by 6 each time to get the dates that start and end the weeks between
  const weeks = {};

  let ctx = {};
  for (let count = 1; count < weekNumber + 1; count++) {
    let start;
    let end;
    let daysInWeek = {};

    if (!ctx.start) {
      start = moment().endOf('day');
    } else {
      start = ctx.end;
    }

    end = moment(start).subtract(6, "day").startOf('day');

    ctx = {
      start,
      end
    };

    // get days between start and end
    let daysCtx = {};
    for (let dayCount = 1; dayCount < 6; dayCount++) {
      let dayStart;

      if (!daysCtx.start) {
        dayStart = start;
      } else {
        dayStart = daysCtx.start;
      }

      dayStart = moment(dayStart).subtract(1, "day").startOf('day');

      daysCtx = {
        start: dayStart
      };

      daysInWeek[dayCount] = {
        start:moment(dayStart).startOf('day'),
        end:moment(dayStart).endOf('day')
      }
    }

    weeks[count] = {
      start,
      end,
      daysInWeek
    };
  }

  return weeks;
}

getWeekBreakDown(14)

app.use("/health", (req, res) => res.send());

app.post(
  "/auth/login",
  celebrate({
    body: Joi.object().keys({
      phone: Joi.string()
        .required()
        .error(new Error("Please provide a phone number")),
      password: Joi.string()
        .required()
        .error(new Error("Please provide a password"))
    })
  }),
  async (req, res) => {
    const { phone, password } = req.body;

    const userData = await db
      .collection("user")
      .findOne({ phoneNumber: phone });

    // console.log(userData);
    if (userData) {
      if (userData.password === sha1(password)) {
        return res.send(
          Object.assign(userData, {
            password: undefined,
            token: jwt.sign(userData, config[NODE_ENV].hashingSecret)
          })
        );
      }
    }

    return res
      .status(401)
      .send({ message: "Wrong username and password combination" });
  }
);

app.post(
  "/auth/register",
  celebrate({
    body: Joi.object().keys({
      password: Joi.string().required(),
      email: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      middleName: Joi.string().required(),
      mobileMoneyNumber: Joi.string().required(),
      phoneNumber: Joi.string().required()
    })
  }),
  async (req, res) => {
    const { body: user } = req;

    // check if user already exists
    const userData = await db
      .collection("user")
      .findOne({ phoneNumber: user.phoneNumber });

    // console.log({ userData })
    if (userData) {
      return res
        .status(401)
        .send({ message: "Phone number already used, trying to log in?" });
    }

    Object.assign(user, {
      _id: new ObjectId(),
      password: sha1(user.password),
      destroyed: false
    });

    await db.collection("user").insertOne(user);

    return res.send({ token: jwt.sign(user, config[NODE_ENV].hashingSecret) });
  }
);

app.post("/submision", async (req, res) => {
  const submission = req.body;

  const [existingSubmission] = await db
    .collection("submision")
    .find({ completionId: submission.completionId })
    .toArray();

  if (existingSubmission) {
    return res.status(200).send({
      exists: true,
      _id: existingSubmission._id
    });
  }

  // find the files and use they data in the url to generate the url
  Object.entries(submission).map(([key, value]) => {
    if (value) {
      if (value.toString().includes("file://")) {
        const [, ext] = value.split(".");

        submission[
          key
        ] = `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${
          submission.questionnaireId
        }_${key}_${submission.completionId}${ext ? `.${ext}` : ""}`;
      }

      if (value === false) {
        submission[key] = 0;
      }
    }

    if (moment(value, moment.ISO_8601, true).isValid()) {
      submission[key] = moment(value).toDate();
    }
  });

  await db.collection("submision").insertOne(
    Object.assign({}, submission, {
      createdAt: new Date(),
      destroyed: false,
      userId: req.user ? req.user._id : undefined
    })
  );

  // send the emails here and other realtime stuff for the dashboards
  // sendMail({
  //     to: "credistart@gmail.com",
  //     subject: `Notification of a completed interview ${id} at ${new Date().toLocaleString()}`,
  //     message: `
  //     A new interview has been completed, please view at <a href="http://sabekinstitute.co.ke/dashboard.html#!/interview=${id}">view</a>
  //     <hr>
  //     <pre>${JSON.stringify(submission, null, "\t")}</pre>
  //   `
  // }).then(console.log).catch(console.log)

  const [submited] = await db
    .collection("submision")
    .find({ completionId: submission.completionId })
    .toArray();

  return res.send({ _id: submited._id });
});

app.get("/submision/:id", async (req, res) => {
  const submission = req.params;
  const { id } = submission;

  const [submision] = await db
    .collection("submision")
    .find({ _id: ObjectId(id) })
    .toArray();

  res.send(submision);
});

app.get("/submision/breakDown/:days", auth, async (req, res) => {
  const { days = 30 } = req.params;
  const weeks = getWeekBreakDown(days);

  const promises = [];
  Object.keys(weeks).map(async weekKey => {
    return Object.keys(weeks[weekKey].daysInWeek).map(async day => {
      promises.push(
        new Promise(async (resolve, reject) => {
          const testDate = "2018-10-20T00:15:20.442Z";
          const testDate2 = "2018-10-22T00:15:20.442Z";

          const { start, end } = weeks[weekKey].daysInWeek[day];

          const submisions = await db
            .collection("submision")
            .find(
              Object.assign(
                {
                  completedAt: {
                    $gte: start.toISOString(),
                    $lte: end.toISOString()
                  }
                },
                req.user ? { phoneNumber: req.user.phoneNumber } : {}
              )
            )
            .count();

          resolve({
            submisions,
            weekKey,
            day
          });
        })
      );
    });
  });

  const residue = await Promise.all(promises);

  residue.map(x => {
    weeks[x.weekKey].daysInWeek[x.day].completions = x.submisions;
  });

  res.send(weeks);
});

app.get("/submisions/:questionnaireId", async (req, res) => {
  // try {
  const submission = req.params;
  const { questionnaireId } = submission;

  const compoundedProps = [];
  const computedProps = [];

  const dashboards = await db
    .collection("dashboard")
    .find({ questionnaire: questionnaireId, destroyed: false })
    .toArray();

  const data = await Promise.all(
    dashboards.map(async dashboard => [
      await db
        .collection("cpd")
        .find({ dashboard: dashboard._id.toString(), destroyed: false })
        .toArray(),
      await db
        .collection("cp")
        .find({ dashboard: dashboard._id.toString(), destroyed: false })
        .toArray()
    ])
  );

  // extract all the cps'd and cpds
  data.map(dashboard => {
    const [cpds, cps] = dashboard;
    compoundedProps.push(...cpds);
    computedProps.push(...cps);
  });

  const submisions = await db
    .collection("submision")
    .find({ questionnaireId })
    .toArray();

  // console.log({ submisions })
  const computed = submisions.map(row => {
    const copyRecord = {};
    computedProps.map(form => {
      var tempFn = doT.template(form.formular || "");
      console.log("computed", { formular: form.formular });
      var resultFormular = tempFn(row);

      console.log("computed", { resultFormular });

      copyRecord[form.name] = math.eval(resultFormular);
    });
    // Object.assign(copyRecord, row)
    return copyRecord;
  });

  const compounded = {};
  // console.log({ compoundedProps })
  compoundedProps.map(c => {
    if (c.type === "formular") {
      // console.log("compoundedProps", { formular: c.formular })
      var tempFn = doT.template(c.formular);
      var resultFormular = tempFn(compounded);
      // console.log("compoundedProps", { resultFormular })
      const compiled = math.eval(resultFormular);
      // console.log("compoundedProps", { compiled })
      compounded[c.name] = compiled;
      return;
    }

    // console.log("compoundedProps", { field: c.field, computed })
    const values = computed
      .filter(row => row[c.field])
      .map(row => row[c.field]);
    // console.log("compoundedProps", { values })
    const result = math[c.type](values);
    // console.log("compoundedProps", { result })
    compounded[c.name] = typeof result === "object" ? result[0] : result;
  });
  console.log({ computed });
  res.send({
    computed,
    compounded
  });
  // } catch (err) {
  //   res.status(500).send({ err })
  // }
});

const lowLevelParser = (req, res) =>
  new Promise((resolve, rej) => {
    parser.parse(req, res, { dir: "/tmp" }, (fields, file) => {
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
  "/upload",
  multer.single("file"),
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json(),
  async (req, res) => {
    // console.log(req.body);
    // console.log(req.file);

    const { questionnaire = "", tag = "", interviewId = "" } = req.body;
    const [, ext] = req.file.originalname.split(".");

    const Key = `${questionnaire}_${tag}_${interviewId}${ext ? `.${ext}` : ""}`;
    res.status(201).send({
      uri: `https://s3-us-west-2.amazonaws.com/questionnaireuploads/${Key}`
    });

    // upload and save link in db, accessible via /questionnaireId/id
    const s3 = new AWS.S3();
    const fileData = fs.readFileSync(req.file.path);

    const params = {
      Bucket: "questionnaireuploads",
      Key,
      Body: fileData,
      ACL: "public-read"
    };
    await s3.putObject(params).promise();
  }
);

app.use(errors());

export default app;
