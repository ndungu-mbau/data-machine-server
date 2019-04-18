/* eslint-disable no-underscore-dangle */

const type = `
  type role {
    id: String,
    user: user,
    client:client,
    name:String,
    permissions:[String],
    company:client,
    users:[user]
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
    async company({ clientId }, args, { db }) {
      const clientData = await db
        .collection('company')
        .findOne({ _id: clientId });

      return Object.assign(clientData, {
        // eslint-disable-next-line comma-dangle
        id: clientData._id
      });
    },
    async users({ _id }, args, { db }) {
      const usersInRole = await db
        .collection('user_roles')
        .find({ role: _id }).toArray();

      const users = await Promise.all(usersInRole.map(({ userId }) => db
        .collection('user')
        .findOne({ _id: userId })));

      return users.filter(x => x).map(user => Object.assign({}, user, {
        id: user._id,
      }));
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
