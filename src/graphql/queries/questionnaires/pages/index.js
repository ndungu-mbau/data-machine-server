const type = `
  type page {
    id: String,
    name: String,
    questionnaire:questionnaire!,
    groups:[group]
  }
`;

const queries = `
  page(id:String!):page,
  pages(filter:filter!):[page]
`;

const page = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'pages',
    path: ['pages', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const pages = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('pages')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  page,
  pages,
};

export {
  type,
  queries,
  root,
};
