const type = `
  type cpd {
    id: String,
    dashboard: String,
    name: String,
    formular: String,
    type: String,
    field: String,
  }
`;

const queries = `
  cpd(id:String!):cp,
  cpds(filter:filter!):[cp]
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
