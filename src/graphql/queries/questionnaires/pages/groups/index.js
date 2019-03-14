const type = `
  type group {
    id: String,
    name: String,
    page:page!,
    questions:[question]
  }
`;

const queries = `
  group(id:String!):group,
  groups(filter:filter!):[group]
`;

const group = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'groups',
    path: ['groups', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const groups = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('groups')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  group,
  groups,
};

const nested = {
  group: {
    questions: async ({ id }, { filter = {} }, { db }) => {
      const data = await db.collection("question").find({ group: id.toString(), destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    }
  }
}

export {
  type,
  queries,
  root,
  nested
};
