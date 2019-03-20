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
    client:client,
    role:[role]
  }
`;

const queries = `
  user(id:String):user,
  users(filter:filter):[user]
`;

const user = async (_, { filter = {} } = {}, { db, ObjectId, user }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  console.log(user);
  const userDetailsForSearch = { _id: new ObjectId(user._id) };

  console.log("finding user", { userDetailsForSearch });
  const [userDetails] = await db
    .collection("user")
    .find(userDetailsForSearch)
    .toArray();
  const [saasUserDetails] = await db
    .collection("saasUser")
    .find(userDetailsForSearch)
    .toArray();

  console.log("found user", { userDetails });
  userDetails.id = userDetails._id;
  return Object.assign(
    {},
    userDetails,
    !saasUserDetails
      ? {}
      : {
          address: saasUserDetails.address_1,
          city: saasUserDetails.city
        }
  );
};

const users = async (_, { filter = {} } = {}, { db }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const data = await db
    .collection("user")
    .find({ destroyed: false })
    .toArray();

  return data.map(entry =>
    Object.assign({}, entry, {
      id: entry._id
    })
  );
};

const nested = {
  user: {
    client: async ({ id, user }, { filter = {} }, { db, ObjectId }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;

      console.log(`Fetching client from users details ${id}`);
      const client = await db.collection("company").findOne({ createdBy: id });

      if (!client) {
        return {
          id: "legacy account"
        };
      }

      return Object.assign(client, {
        id: client._id,
        name: client.company_name,
        reg_id: client.company_registration_id,
        contact_email: client.company_email,
        comms_sms: client.communications_sms
      });
    },
    teams: async ({ id }, { filter = {} }, { db, ObjectId }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const relations = await db
        .collection("user_teams")
        .find({ user: id.toString() })
        .toArray();
      const teams = await db
        .collection("team")
        .find({
          _id: { $in: relations.map(relation => ObjectId(relation.team)) }
        })
        .toArray();

      const teamsInfo = teams.map(entry =>
        Object.assign({}, entry, {
          id: entry._id
        })
      );

      console.log(teamsInfo);

      return teamsInfo;
    },
    role: async ({ id }, {}, { db, ObjectId }) => {
      console.log(">>", id);
      const data = await db
        .collection("roles")
        .find({ userId: id.toString() })
        .toArray();
      console.log(data);
      return data;
    }
  }
};

const root = {
  user,
  users
};

export { type, queries, nested, root };
