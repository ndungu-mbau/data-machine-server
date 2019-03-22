import nodemailer from 'nodemailer';
import doT from 'dot';
import { promisify } from 'util';
import fs from 'fs';

const readFile = promisify(fs.readFile);

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  // eslint-disable-next-line radix
  secure: parseInt(process.env.EMAIL_SECURE),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const mailOptions = {
  from: `"Datakit Support " <${process.env.EMAIL_BASE}>`,
};

export const sendMail = ({ to, subject, message }) =>
  new Promise((resolve, reject) => {
    mailOptions.to = to;
    mailOptions.subject = subject;
    mailOptions.html = message;
    // send mail with defined transport object
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        return reject(error);
      }

      return resolve(info);
    });
  });


const registrationThanks = async ({
  to,
  subject = 'Thank you for registering!',
  data,
}) => {
  const tempFn = doT.template((await readFile('src/app/emails/registration-thanks.html', 'utf8')));
  const message = tempFn(data);
  sendMail({
    to,
    subject,
    message,
  });
};

const passwordResetEmail = async ({
  to,
  subject = 'Reset your datakit password',
  data,
}) => {
  const tempFn = doT.template((await readFile('src/app/emails/password-reset.html', 'utf8')));
  const message = tempFn(data);

  sendMail({
    to,
    subject,
    message,
  });
};

const userLoggedIn = async ({
  to,
  subject = 'User logged in',
  data,
}) => {
  sendMail({
    to,
    subject,
    message: `${data.email} just logged in`,
  });
};

const appUserLoggedIn = async ({
  to,
  subject = 'User logged in to on the app',
  data,
}) => {
  sendMail({
    to,
    subject,
    message: `${data.phoneNumber} just logged in <br><br><br><pre>${JSON.stringify(data.userData, null, '\t')}</pre>`,
  });
};

const userCreatedAccount = async ({
  to,
  subject = 'User created account',
  data,
}) => {
  sendMail({
    to,
    subject,
    message: `${data.email} just registered`,
  });
};

// registrationThanks({
//     to: "sirbranson67@gmail.com",
// data: {
//     firstName:'Branson',
//     lastName:'Gitomeh',
//     company:{
//         name:'braiven.io'
//     }
// }
// })

// passwordReset({
//     to: "sirbranson67@gmail.com",
//     data: {
//         firstName:'Branson'
//     }
// })

export {
  registrationThanks,
  passwordResetEmail,
  userLoggedIn,
  userCreatedAccount,
  appUserLoggedIn,
};
