import nodemailer from 'nodemailer';
import doT from 'dot';
import { promisify } from 'util';
import fs from 'fs';

const { NODE_ENV } = process.env;

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

export const sendMail = ({
  from,
  to,
  subject,
  message,
  attachments,
  cc,
  bcc,
}) => new Promise((resolve, reject) => {
  if (NODE_ENV === 'test') {
    resolve();
  }

  mailOptions.to = to;
  mailOptions.subject = subject;
  mailOptions.html = message;

  Object.assign(mailOptions, {
    cc,
    bcc,
  });

  const newOptions = { ...mailOptions };

  if (attachments) {
    Object.assign(newOptions, {
      attachments,
    });
  }

  if (from) {
    Object.assign(newOptions, {
      from,
    });
  }

  // send mail with defined transport object
  transporter.sendMail(newOptions, async (error, info) => {
    // console.log({ error, info });
    // async save the email send to our collection

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
  const tempFn = doT.template(
    await readFile('src/app/emails/registration-thanks.html', 'utf8'),
  );
  const message = tempFn(data);
  sendMail({
    to,
    subject,
    message,
  });
};

const accountActivationEmail = async ({
  to,
  subject = 'Activate your account',
  data,
}) => {
  const tempFn = doT.template(
    await readFile('src/app/emails/activate-account.html', 'utf8'),
  );
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
  const tempFn = doT.template(
    await readFile('src/app/emails/password-reset.html', 'utf8'),
  );
  const message = tempFn(data);

  sendMail({
    to,
    subject,
    message,
  });
};

const userLoggedIn = async ({ to, subject = 'User logged in', data }) => {
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
    message: `${
      data.phoneNumber
    } just logged in <br><br><br><pre>${JSON.stringify(
      data.userData,
      null,
      '\t',
    )}</pre>`,
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

const sendDocumentEmails = ({
  to,
  cc,
  from,
  bcc,
  subject = 'Your document is now ready',
  message,
  attachments,
}) => {
  sendMail({
    to,
    from,
    cc,
    bcc,
    subject,
    message,
    attachments,
  });
};

const sendInvitationEmail = async ({
  to,
  data: {
    invitation: {
      id,
      name: newUserName,
    },
    inviter: {
      name,
      email,
      company: {
        name: companyName,
      },
    },
    host,
  },
}) => {
  const tempFn = doT.template(
    await readFile('src/app/emails/user_invited.html', 'utf8'),
  );
  const message = tempFn({
    invitation: {
      id,
      name,
    },
    inviter: {
      name: newUserName,
      email,
      company: {
        name: companyName,
      },
    },
    host,
  });

  sendMail({
    to,
    subject: `Invitation to join ${companyName}`,
    message,
  });
};

export {
  registrationThanks,
  accountActivationEmail,
  passwordResetEmail,
  userLoggedIn,
  userCreatedAccount,
  appUserLoggedIn,
  sendDocumentEmails,
  sendInvitationEmail,
};
