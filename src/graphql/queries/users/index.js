/* eslint-disable no-underscore-dangle */
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
    other: String,
    teams:[team],
    client:client,
    clients:[client],
    roles:[role]
  }
`;

const queries = `
  user(id:String):user,
  users(filter:filter):[user]
`;

const user = async (_, args, { db, ObjectId, user: currentUser }) => {
  const userDetailsForSearch = { _id: new ObjectId(currentUser._id) };

  const [userDetails] = await db
    .collection('user')
    .find(userDetailsForSearch)
    .toArray();
  const [saasUserDetails] = await db
    .collection('saasUser')
    .find(userDetailsForSearch)
    .toArray();

  userDetails.id = userDetails._id;
  return Object.assign(
    {},
    userDetails,
    !saasUserDetails
      ? {}
      : {
        address: saasUserDetails.address_1,
        city: saasUserDetails.city,
      },
  );
};

const users = async (_, args, { db }) => {
  const data = await db
    .collection('user')
    .find({ destroyed: false })
    .toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const nested = {
  user: {
    client: async ({ id, client: clientId }, args, { db }) => {
      const client = await db.collection('company').findOne({ _id: clientId });

      if (!client) {
        // find role with user id in it
        const roleUser = await db.collection('user_roles').findOne({ userId: id });

        if (roleUser) {
          const role = await db.collection('role').findOne({ _id: roleUser.role });

          const clientFromRole = await db.collection('company').findOne({ _id: role.clientId });

          return Object.assign(clientFromRole, {
            id: clientFromRole._id,
            name: clientFromRole.company_name,
            reg_id: clientFromRole.company_registration_id,
            contact_email: clientFromRole.company_email,
            comms_sms: clientFromRole.communications_sms,
          });
        }

        return {
          id: 'legacy account',
        };
      }

      return Object.assign(client, {
        id: client._id,
        name: client.company_name,
        reg_id: client.company_registration_id,
        contact_email: client.company_email,
        comms_sms: client.communications_sms,
      });
    },
    clients: async ({ id, client: clientId }, args, { db }) => {
      // find role with user id in it
      const roleUsers = await db.collection('user_roles').find({ userId: id }).toArray();

      if (roleUsers.length !== 0) {
        return roleUsers.map(async (roleUser) => {
          const role = await db.collection('role').findOne({ _id: roleUser.role });

          const clientFromRole = await db.collection('company').findOne({ _id: role.clientId });

          return Object.assign(clientFromRole, {
            id: clientFromRole._id,
            name: clientFromRole.company_name,
            reg_id: clientFromRole.company_registration_id,
            contact_email: clientFromRole.company_email,
            comms_sms: clientFromRole.communications_sms,
          });
        });
      }

      const client = await db.collection('company').findOne({ _id: clientId });

      if (!client) {
        return [{
          id: 'legacy account',
        }];
      }

      return [
        Object.assign(client, {
          id: client._id,
          name: client.company_name,
          reg_id: client.company_registration_id,
          contact_email: client.company_email,
          comms_sms: client.communications_sms,
        }),
      ];
    },
    teams: async ({ id }, args, { db, ObjectId }) => {
      const relations = await db
        .collection('user_teams')
        .find({ user: id.toString() })
        .toArray();
      const teams = await db
        .collection('team')
        .find({
          _id: { $in: relations.map(relation => ObjectId(relation.team)) },
        })
        .toArray();

      const teamsInfo = teams.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));

      return teamsInfo;
    },
    roles: async ({ id }, args, { db }) => {
      // eslint-disable-next-line camelcase
      const user_roles = await db
        .collection('user_roles')
        .find({ userId: id, destroyed: false })
        .toArray();

      const completeRoles = [];
      // eslint-disable-next-line camelcase
      const fetchedRoles = await Promise.all(
        user_roles.map(userRole => db
          .collection('role')
          .find({ _id: userRole.role, destroyed: false })
          .toArray()),
      );

      fetchedRoles.map(roleMap => completeRoles.push(...roleMap));

      return completeRoles.map(entry => Object.assign({}, entry, {
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
  type, queries, nested, root,
};
