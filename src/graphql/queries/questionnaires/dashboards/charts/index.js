const type = `
type col {
  prop: String,
  label: String,
  color: String
}

type chart {
  id: String,
  name: String,
  label: String,
  type: String,
  html:String,
  cols:[col],
  dashboard:String
}
`;

const queries = `
  chart(id:String!):chart,
  charts(filter:filter!):[chart]
`;

const chart = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'charts',
    path: ['charts', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const charts = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('charts')
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
  chart,
  charts,
};

export { type, queries, root };
