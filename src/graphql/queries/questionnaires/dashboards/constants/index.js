const type = `
type constant {
  id: String,
  name: String,
  value: String
}
`;

const queries = `
  constant(id:String!):constant,
  constants(filter:filter!):[constant]
`;

const constant = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'constants',
    path: ['constants', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const constants = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('constants')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }),);
};

const root = {
  constant,
  constants,
};

export { type, queries, root };
