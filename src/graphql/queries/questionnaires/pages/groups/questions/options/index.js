const type = `
  type option {
    label: String,
    value: String,
  }
`;

const queries = `
  option(id:String!):option,
  options(filter:filter!):[option]
`;

const option = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'options',
    path: ['options', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const options = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('options')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  option,
  options,
};

export {
  type,
  queries,
  root,
};
