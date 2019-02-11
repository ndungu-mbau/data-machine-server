import { root as questionnaireRoot } from '../questionnaires';

const type = `
  type client {
    id: String,
    name: String,
    reg_id: String,
    contact_email: String,
    contact: String,
    comms_sms:String,
    projects:[project],
    teams:[team],
    users:[user],
    billing:billing,
  }
`;

const queries = `
  client(id:String):client,
  clients(filter:filter):[client]
`;

const client = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'clients',
    path: ['clients', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const clients = async (_, { filter = {} }, { db }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const data = await db.collection("client").find({ destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const nested = {
  client: {
    teams: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("team").find({ client: id.toString(), destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    users: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("user").find({ client: id }).toArray();

      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    projects: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("project").find({ client: id.toString(), destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    billing: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("billing").find({ client: id.toString(), destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
  }
}

const root = {
  client,
  clients,
};

export {
  type,
  queries,
  nested,
  root,
};
