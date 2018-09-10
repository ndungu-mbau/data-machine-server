const type = `
  type user {
    id: String,
    firstName: String,
    middleName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    mobileMoneyNumber: String
  }
`;

const queries = `
  users(filter:filter):[user]
`;

const users = async (_, { filter = {} } = {}, { db }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const data = await db.collection("user").find({ destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const root = {
  users,
};

export {
  type,
  queries,
  root,
};
