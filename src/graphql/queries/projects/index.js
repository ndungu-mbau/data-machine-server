/* eslint-disable no-underscore-dangle */
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
    teams: async ({ id }, args, { db, ObjectId }) => {
      const relations = await db.collection('project_teams').find({ project: id.toString() }).toArray();
      const teams = await db.collection('team').find({ _id: { $in: relations.map(relation => ObjectId(relation.team)) } }).toArray();
      return teams.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
    questionnaire: async ({ questionnaire }, args, { db }) => {
      const data = await db.collection('questionnaire').findOne({ _id: questionnaire, destroyed: false });

      if (!data) {
        return null;
      }

      data.id = data._id;
      return data;
    },
  },
};

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
