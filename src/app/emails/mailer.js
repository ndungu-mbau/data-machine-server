import nodemailer from 'nodemailer';
import doT from 'dot'
import { promisify } from 'util'
import fs from 'fs'

const readFile = promisify(fs.readFile)

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: parseInt(process.env.EMAIL_SECURE),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// setup e-mail data, even with unicode symbols
const mailOptions = {
    from: `"Datakit Support " <${process.env.EMAIL_BASE}>`, // sender address (who sends)
};

export const sendMail = ({ to, subject, message }) =>
    new Promise((resolve, reject) => {
        mailOptions.to = to;
        mailOptions.subject = subject;
        mailOptions.html = message;
        // send mail with defined transport object
        transporter.sendMail(mailOptions, async (error, info) => {
            // console.log({ error, info });
            // async save the email send to our collection on google
            // const emailSends = datastore.key('emailSends');

            // await datastore.save({
            //   key: emailSends,
            //   data: Object.assign(
            //     {},
            //     { error },
            //     info,
            //     { subject },
            //     { message, triggedAt: new Date().toISOString() },
            //   ),
            // });

            if (error) {
                return reject(error);
            }

            resolve(info);
        });
    });


const registrationThanks = async ({
    to,
    subject = `Thank you for registering!`,
    data
}) => {
    const tempFn = doT.template((await readFile('src/app/emails/registration-thanks.html', 'utf8')));
    var message = tempFn(data);
    // console.log(resusltEmail)

    sendMail({
        to,
        subject,
        message
    }).catch(console.log)
}

const passwordResetEmail = async ({
    to,
    subject = `Reset your datakit password`,
    data
}) => {
    const tempFn = doT.template((await readFile('src/app/emails/password-reset.html', 'utf8')));
    var message = tempFn(data);

    sendMail({
        to,
        subject,
        message
    }).catch(console.log)
}

const userLoggedIn = async ({
    to,
    subject = `User logged in`,
    data
}) => {
    // const tempFn = doT.template((await readFile('src/app/emails/password-reset.html', 'utf8')));
    // var message = tempFn(data);

    sendMail({
        to,
        subject,
        message: data.email + " just logged in"
    }).catch(console.log)
}

const appUserLoggedIn = async ({
    to,
    subject = `User logged in to on the app`,
    data
}) => {
    // const tempFn = doT.template((await readFile('src/app/emails/password-reset.html', 'utf8')));
    // var message = tempFn(data);

    sendMail({
        to,
        subject,
        message: data.phoneNumber + " just logged in" + `<br><br><br><pre>${JSON.stringify(data.userData, null, '\t')}</pre>`
    }).catch(console.log)
}

const userCreatedAccount = async ({
    to,
    subject = `User created account`,
    data
}) => {
    // const tempFn = doT.template((await readFile('src/app/emails/password-reset.html', 'utf8')));
    // var message = tempFn(data);

    sendMail({
        to,
        subject,
        message: data.email + " just registered"
    }).catch(console.log)
}

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
    appUserLoggedIn
}