const type = `
  type project {
    id: String,
    name: String,
    questionnaire:questionnaire,
    client:client
  }

  input filter {
    destroyed: Boolean,
    offset: String,
    limit:String
  }
`;

const queries = `
  project(id:String!):project,
  projects(filter:filter!):[project]
`;

const project = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'projects',
    path: ['projects', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const projects = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('projects')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  project,
  projects,
};

export {
  type,
  queries,
  root,
};
