/* eslint-disable no-underscore-dangle */
import { root as questionnaireRoot } from '../questionnaires';

const type = `
  type team {
    id: String,
    name: String,
    description: String,
    users:[user],
    projects:[project]
    dashboards:[dashboard]
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

const projectQuestionnaire = questionnaireId => async (
  attrs,
  { datastore },
) => questionnaireRoot.questionnaire(
  { id: questionnaireId },
  { datastore },
);

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
    users: async ({ id }, args, { db, ObjectId }) => {
      const relations = await db.collection('user_teams').find({ team: id.toString() }).toArray();

      const users = await db.collection('user').find({ _id: { $in: relations.map(relation => ObjectId(relation.user)) }, destroyed: false }).toArray();

      return users.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    dashboards: async ({ id }, args, { db, ObjectId }) => {
      // const relations = await db.collection('dashboard_teams').find({ team: id.toString() }).toArray();

      // const dashboards = await db.collection('dashboards').find({ _id: { $in: relations.map(relation => ObjectId(relation.dashboard)) }, destroyed: false }).toArray();

      // return dashboards.map(entry => Object.assign({}, entry, {
      //   id: entry._id,
      // }));
      return [{
        id:1,
        name:"Sales Monitoring",
        url:"https://metabase.braiven.io/public/dashboard/fcc20dcb-544c-44c8-9dd5-ddc0318e8be0"
      }]
    },
    projects: async ({ id }, args, { db, ObjectId }) => {
      const relations = await db.collection('project_teams').find({ team: id.toString() }).toArray();

      const projects = await db.collection('project').find({ _id: { $in: relations.map(relation => ObjectId(relation.project)) }, destroyed: false }).toArray();

      return projects.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
  },
};

const root = {
  team,
  teams,
};

export {
  type,
  queries,
  nested,
  root,
};
