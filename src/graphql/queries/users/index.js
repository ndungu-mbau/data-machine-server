const type = `
  type user {
    id: String,
    firstName: String,
    middleName: String,
    lastName: String,
    email: String,
    city: String,
    address: String,
    phoneNumber: String,
    mobileMoneyNumber: String,
    teams:[team],
    client:client
  }
`;

const queries = `
  user:user,
  users(filter:filter):[user]
`;

const user = async (_, { filter = {} } = {}, { db, user }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const [userDetails] = await db.collection('user').find({ phoneNumber: user.phoneNumber }).toArray();
  const [saasUserDetails] = await db.collection('saasUser').find({ phoneNumber: user.phoneNumber }).toArray();

  userDetails.id = userDetails._id;
  return Object.assign({}, userDetails, {
    address: saasUserDetails.address_1,
    city: saasUserDetails.city
  });
};

const users = async (_, { filter = {} } = {}, { db }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const data = await db.collection('user').find({ destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const nested = {
  user: {
    client: async ({ id, user }, { filter = {} }, { db, ObjectId }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;

      console.log(`Fetching client from users details ${id}`)
      const client = await db.collection('company').findOne({ createdBy: id });

      return Object.assign(client, {
        id: client._id,
        name: client.company_name
      });
    },
    teams: async ({ id }, { filter = {} }, { db, ObjectId }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const relations = await db.collection('user_teams').find({ user: id.toString() }).toArray();
      const teams = await db.collection('team').find({ _id: { $in: relations.map(relation => ObjectId(relation.team)) } }).toArray();

      return teams.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
  },
};

const root = {
  user,
  users,
};

export {
  type,
  queries,
  nested,
  root,
};
