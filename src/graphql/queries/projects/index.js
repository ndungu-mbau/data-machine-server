const type = `
  type project {
    id: String,
    name: String,
    questionnaire:questionnaire,
    client:client
    teams:[team]
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


const nested = {
  project: {
    teams: async ({ id }, { filter = {} }, { datastore }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const query = datastore.createQuery('project_teams')
        .filter('project', id)
        .filter('destroyed', destroyed)
        .offset('offset', offset)
        .limit('limit', limit);

      const [relation] = await datastore.runQuery(query);

      if (relation.length == 0) {
        return []
      }

      const [teams] = await datastore.get(relation.map(({ team }) => ({
        kind: 'teams',
        path: ["teams", team],
        id: team
      })));

      return teams.map(entry => Object.assign({}, entry, {
        id: entry[datastore.KEY].id
      }));
    },
    questionnaire:  require("../questionnaires").questionnaire
  }
}

const root = {
  project,
  projects,
};

export {
  type,
  queries,
  nested,
  root,
};
