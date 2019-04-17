import emit from '../../../app/actions/index';
/* eslint-disable no-underscore-dangle */
const collection = 'client';
const { NODE_ENV } = process.env;
const { sendInvitationEmail } = require('../../../app/emails/mailer');

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false,
  });
  db.collection(collection).insertOne(entry);
  emit({ data: entry, action: 'CLIENT_CREATED' });
  entry.id = entry._id;
  return entry;
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  const companyChange = Object.assign({}, entry, {
    id: undefined,
    company_name: entry.name,
    company_registration_id: entry.reg_id,
    company_email: entry.contact_email,
    company_contact: entry.comms_sms,
    contact: entry.comms_sms,
  });

  db.collection('company').updateOne(
    {
      _id: new ObjectId(entry.id),
    },
    {
      $set: companyChange,
    },
  );

  return db.collection(collection).updateOne(
    { _id: new ObjectId(entry.id) },
    {
      $set: Object.assign({}, entry, {
        id: undefined,
      }),
    },
  );
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: true } });
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: false } });
};

const inviteUser = async (args, { db, user, ObjectId }) => {
  const invitation = {
    _id: new ObjectId(),
    user: args.invitation.email,
    name: args.invitation.name,
    client: args.invitation.client,
    role: args.invitation.role,
    invitedBy: user._id,
    destroyed: false,
  };

  await db.collection('invitation')
    .insertOne(invitation);

  const client = await db.collection('company')
    .findOne({ _id: new ObjectId(args.invitation.client) });

  const mailData = {
    invitation: {
      id: invitation._id,
      name: args.invitation.name,
    },
    inviter: {
      name: user.firstName,
      email: user.email,
      company: {
        name: client.company_name,
      },
    },
    host: NODE_ENV === 'production'
      ? 'https://app.braiven.io'
      : 'http://localhost:3002',
  };

  sendInvitationEmail({
    to: args.invitation.email,
    data: mailData,
  });

  return invitation._id;
};

const cancelInvitation = async (args, { db, ObjectId }) => {
  await db.collection('invitation')
    .removeOne({ _id: new ObjectId(args.invitation) });
};

export {
  create, update, destroy, restore, inviteUser, cancelInvitation,
};
