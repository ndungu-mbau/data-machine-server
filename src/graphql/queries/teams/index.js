import { root as questionnaireRoot } from '../questionnaires';

const type = `
  type team {
    id: String,
    name: String,
    description: String,
    users:[user],
    projects:[project]
  }
`;

const queries = `
  team(id:String):team,
  teams(filter:filter):[team]
`;

const team = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'teams',
    path: ['teams', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const projectQuestionnaire = questionnaireId =>
  async (attrs, { datastore }) =>
    questionnaireRoot.questionnaire({ id: questionnaireId }, { datastore });

const teamProjects = teamId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('team_projects')
    .filter('team', teamId)
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

const teamUsers = teamId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('user_teams')
    .filter('team', teamId)
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

const teams = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('teams')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);

  entities[0].map(entity => Object.assign(entity, {
    projects: teamProjects(entity[datastore.KEY].id),
  }));

  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const nested = {
  team: {
    users: async ({ id }, { filter = {} }, { datastore }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const query = datastore.createQuery('user_teams')
        .filter('team', id)
        .filter('destroyed', destroyed)
        .offset('offset', offset)
        .limit('limit', limit);

      const [relation] = await datastore.runQuery(query);

      if (relation.length == 0)
        return []

      const [users] = await datastore.get(relation.map(({ user }) => ({
        kind: 'users',
        path: ["users", user],
        id: user
      })));

      return users.map(entry => Object.assign({}, entry, {
        id: entry[datastore.KEY].id
      }));
    },
    projects: async ({ id }, { filter = {} }, { datastore }) => {
      const { destroyed = false, offset = 0, limit = 100 } = filter;
      const query = datastore.createQuery('project_teams')
        .filter('team', id)
        .filter('destroyed', destroyed)
        .offset('offset', offset)
        .limit('limit', limit);

      const [relation] = await datastore.runQuery(query);

      // console.log(relation.shift())
      if (relation.length == 0)
        return []

      const projects = await datastore.get(relation.map(({ project }) => ({
        kind: 'projects',
        path: ["projects", project],
        id: project
      })));

      return projects.shift().map(entry => Object.assign({}, entry, {
        id: entry[datastore.KEY].id
      }));
    }
  }
}

const root = {
  team,
  teams
};

export {
  type,
  queries,
  nested,
  root,
};
