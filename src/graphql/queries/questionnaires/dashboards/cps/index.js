const type = `
  type cp {
    id: String,
    dashboard: String,
    name: String,
    numerator:String,
    sum: [String],
    difference: [String],
    division: [String],
    multiply: [String],
  }
`;

const queries = `
  cp(id:String!):cp,
  cps(filter:filter!):[cp]
`;

const cp = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'cps',
    path: ['cps', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const cps = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('cps')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }), );
};

const root = {
  cp,
  cps,
};

export { type, queries, root };
