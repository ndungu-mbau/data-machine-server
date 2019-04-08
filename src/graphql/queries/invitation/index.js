/* eslint-disable no-underscore-dangle */
const type = `
  type invitation {
    id: String,
    user: String,
    client: client,
    time:String,
    role: role
    client: client
    name:String!
  }
`;

const queries = `
  invitation(id:String):invitation,
  invitation(filter:filter):[invitation]
`;

const invitation = async () => {};

const invitations = async (_, args, { db }) => {
  const data = await db.collection('invitation').find({}).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const nested = {
  invitation: {
    role: async ({ role }, args, { db, ObjectId }) => {
      const data = await db.collection('role').findOne({
        _id: new ObjectId(role), destroyed: false,
      });
      return Object.assign({}, data, {
        id: data._id,
      });
    },
    client: async ({ client }, args, { db, ObjectId }) => {
      const data = await db.collection('company').find({
        _id: new ObjectId(client),
        destroyed: false,
      });
      return Object.assign({}, data, {
        id: data._id,
      });
    },
  },
};

const root = {
  invitations,
  invitation,
};

export {
  type,
  queries,
  nested,
  root,
};
