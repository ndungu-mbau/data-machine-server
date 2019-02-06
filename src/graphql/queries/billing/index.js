import { root as questionnaireRoot } from '../questionnaires';

const type = `
  type billing {
    id: String,
    company: client,
    name:String,
    number:String,
    expDate:String,
    expYear:String,
    cvv:String,
    address:String,
    address2:String,
    zip:String,
    country:String,
    user:user
  }
`;

const queries = `
  billing(id:String):billing,
  billings(filter:filter):[billing]
`;

const billing = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'billings',
    path: ['billings', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const billings = async (_, { filter = {} }, { db }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const data = await db.collection("billing").find({}).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const nested = {
  billing: {
    user: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("user").find({
        _id: id, destroyed: false
      }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    company: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("company").find({ _id: id, destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    }
  }
}

const root = {
  billing,
  billings,
};

export {
  type,
  queries,
  nested,
  root,
};
