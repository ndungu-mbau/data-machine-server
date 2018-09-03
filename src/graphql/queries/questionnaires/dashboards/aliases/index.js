const type = `
type condition {
  label: String,
  value: String,
}

  type alias {
    id: String,
    dashboard: String,
    conditions: [condition],
    name: String,
    prop: String,
    rangeDefault: String,
    rangeEnd: String,
    rangeStart: String,
    type: String,
  }
`;

const queries = `
  alias(id:String!):alias,
  aliass(filter:filter!):[alias]
`;

const alias = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'aliass',
    path: ['aliass', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const aliass = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('aliass')
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
  alias,
  aliass,
};

export { type, queries, root };
