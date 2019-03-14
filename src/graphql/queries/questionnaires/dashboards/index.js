const type = `
  type dashboard {
    id: String,
    name: String,
    questionnaire:questionnaire!,

    layout:layout,
    cps:[cp],
    cpds:[cpd],
    aliases:[alias],
    constants:[constant],
    charts:[chart]
  }
`;

const queries = `
  dashboard(id:String!):dashboard,
  dashboards(filter:filter!):[dashboard]
`;

const dashboardLayouts = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('layouts')
    .filter('page', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }),);
};

const dashboard = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'dashboards',
    path: ['dashboards', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
    layouts: dashboardLayouts(entity[0][datastore.KEY].id),
  });
};

const dashboards = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('dashboards')
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
  dashboard,
  dashboards,
};

export { type, queries, root };
