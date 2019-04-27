/* eslint-disable no-underscore-dangle */

const type = `
  type action {
    id: String,
    type: String,
    name:String,
    phone:String,
    to:String,
    cc:String,
    bcc:String,
    message:String,
    requestType:String,
    headers:String,
    url:String
  }
`;

const queries = `
  action(id:String!):action,
  actions(filter:filter!):[action]
`;

const action = async (x, { id }, { db, ObjectId }) => {
  const roles = await db
    .collection('action')
    .find({ _id: new ObjectId(id) })
    .toArray();
  return roles.map(r => Object.assign(r, {
    // eslint-disable-next-line comma-dangle
    id: r._id
  }));
};

const nested = {
  action: {
    // async company({ clientId }, args, { db }) {
    //   const clientData = await db
    //     .collection('company')
    //     .findOne({ _id: clientId });

    //   return Object.assign(clientData, {
    //     // eslint-disable-next-line comma-dangle
    //     id: clientData._id
    //   });
    // },
    // async users({ _id }, args, { db }) {
    //   const usersInRole = await db
    //     .collection('user_roles')
    //     .find({ role: _id }).toArray();

    //   const users = await Promise.all(usersInRole.map(({ userId }) => db
    //     .collection('user')
    //     .findOne({ _id: userId })));

    //   return users.filter(x => x).map(user => Object.assign({}, user, {
    //     id: user._id,
    //   }));
    // },
  },
};

const actions = () => [];

const root = {
  action,
  actions,
};

export {
  type,
  queries,
  root,
  nested,
};
