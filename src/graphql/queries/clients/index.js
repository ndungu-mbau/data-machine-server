import { root as questionnaireRoot } from '../questionnaires';

const type = `
  type client {
    id: String,
    name: String,
    projects:[project],
    teams:[team],
    userGroups:[userGroup],
    clients:[client]
  }
`;

const queries = `
  client(id:String):client,
  clients(filter:filter):[client]
`;

const client = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'clients',
    path: ['clients', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const projectQuestionnaire = questionnaireId =>
  async (attrs, { datastore }) =>
    questionnaireRoot.questionnaire({ id: questionnaireId }, { datastore });

const clientProjects = clientId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('projects')
    .filter('client', clientId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }, {
      questionnaire: projectQuestionnaire(entry.questionnaire),
    }));
};

const clientTeams = clientId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('teams')
    .filter('client', clientId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const clients = async (_, { filter = {} }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('clients')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);

  entities[0].map(entity => Object.assign(entity, {
    // projects: clientProjects(entity[datastore.KEY].id),
    teams: clientTeams(entity[datastore.KEY].id),
  }));

  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const nested = {
  client: {
    teams: async ({ id }, { filter = {} }, { datastore }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const query = datastore.createQuery('teams')
        .filter('client', id)
        .filter('destroyed', destroyed)
        .offset('offset', offset)
        .limit('limit', limit);

      const entities = await datastore.runQuery(query);

      return entities.shift().map(entry => Object.assign({}, entry, {
        id: entry[datastore.KEY].id,
      }));
    },
    projects: async ({ id }, { filter = {} }, { datastore }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const query = datastore.createQuery('projects')
        .filter('client', id)
        .filter('destroyed', destroyed)
        .offset('offset', offset)
        .limit('limit', limit);

      const entities = await datastore.runQuery(query);

      return entities.shift().map(entry => Object.assign({}, entry, {
        id: entry[datastore.KEY].id,
      }));
    }
  }
}

const root = {
  client,
  clients,
};

export {
  type,
  queries,
  nested,
  root,
};
