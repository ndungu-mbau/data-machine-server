const type = `
  type layout {
    id: String,
    name: String,
    page:page!,
    questions:[question]
  }
`;

const queries = `
  layout(id:String!):layout,
  layouts(filter:filter!):[layout]
`;

const layout = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'layouts',
    path: ['layouts', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const layouts = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('layouts')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  layout,
  layouts,
};

export {
  type,
  queries,
  root,
};
