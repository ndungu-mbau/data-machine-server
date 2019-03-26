/* eslint-disable no-underscore-dangle */

const type = `
  type role {
    id: String,
    user: user,
    client:client,
    name:String,
    permissions:[String],
    company:client
  }
`;

const queries = `
  role(id:String!):role,
  roles(filter:filter!):[role]
`;

const role = async (x, { id }, { db, ObjectId }) => {
  const roles = await db
    .collection('role')
    .find({ _id: new ObjectId(id) })
    .toArray();
  return roles.map(r => Object.assign(r, {
    // eslint-disable-next-line comma-dangle
    id: r._id
  }));
};

const nested = {
  role: {
    async company({ client }, args, { db }) {
      const clientData = await db
        .collection('company')
        .findOne({ _id: client });

      return Object.assign(clientData, {
        // eslint-disable-next-line comma-dangle
        id: clientData._id
      });
    },
  },
};

const roles = () => [];

const root = {
  role,
  roles,
};

export {
  type,
  queries,
  root,
  nested,
};
