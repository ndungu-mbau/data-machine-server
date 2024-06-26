/* eslint-disable no-underscore-dangle */
const type = `
  type stats{
    projects: Float,
    submissions: Float,
    teams: Float,
    users:Float,
    fileUploads: Float
  }

  type client {
    id: String,
    name: String,
    reg_id: String,
    contact_email: String,
    comms_sms:String,
    projects:[project],
    teams:[team],
    users:[user],
    billing:billing,
    stats:stats,
    roles:[role],
    invitations:[invitation]
    events:[event]
  }
`;

const queries = `
  client(id:String):client,
  clients(filter:filter):[client],
  companies(filter:filter):[client]
`;

const client = async (_, { id }, { db, ObjectId }) => {
  const data = await db.collection('company').findOne({
    _id: ObjectId(id),
  });

  return { id: data._id, ...data };
};

const clients = async (_, args, { db }) => {
  const data = await db
    .collection('client')
    .find({ destroyed: false })
    .toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const companies = async (_, args, { db }) => {
  const data = await db
    .collection('company')
    .find({ destroyed: false })
    .toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
    name: entry.company_name,
  }));
};

const nested = {
  client: {
    teams: async ({ id }, args, { db }) => {
      const data = await db
        .collection('team')
        .find({ client: id.toString(), destroyed: false })
        .toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    events: async ({ id }, args, { db }) => {
      const actionOrders = await db
        .collection('events')
        .find({ client: id.toString() })
        .toArray();

      return actionOrders.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    stats: async ({ id }, args, { db }) => {
      const teams = await db
        .collection('team')
        .find({ client: id.toString(), destroyed: false })
        .count();
      const projects = await db
        .collection('project')
        .find({ client: id.toString(), destroyed: false })
        .count();
      const users = await db
        .collection('user')
        .find({ client: id, destroyed: false })
        .count();
      const submissions = await db
        .collection('submision')
        .find({ client: id.toString() })
        .count();

      return {
        teams,
        projects,
        users,
        submissions,
      };
    },
    users: async ({ id }, args, { db, ObjectId }) => {
      const data = await db
        .collection('user')
        .find({ client: ObjectId(id) })
        .toArray();

      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    projects: async ({ id }, args, { db }) => {
      const data = await db
        .collection('project')
        .find({ client: id.toString(), destroyed: false })
        .toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    billing: async ({ id }, args, { db }) => {
      const data = await db
        .collection('billing')
        .find({ client: id.toString(), destroyed: false })
        .toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    roles: async ({ id }, args, { db }) => {
      const data = await db
        .collection('role')
        .find({ clientId: id, destroyed: false })
        .toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    invitations: async ({ id }, args, { db }) => {
      const data = await db
        .collection('invitation')
        .find({ client: id.toString(), destroyed: false })
        .toArray();
      return data.map(entry => Object.assign({}, entry, {
        time: entry._id.getTimestamp(),
        id: entry._id,
      }));
    },
  },
};

const root = {
  client,
  clients,
  companies,
};

export {
  type, queries, nested, root,
};
