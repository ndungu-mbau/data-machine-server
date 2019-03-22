/* eslint-disable no-underscore-dangle */
const type = `
  type questionnaire {
    id: String,
    name: String,
    project:project,
    pages:[page],
    order:[String],
    dashboards:[dashboard]
  }
`;

const queries = `
  questionnaire(id:String):questionnaire,
  questionnaires(filter:filter):[questionnaire]
`;

const GroupQuestions = groupId => async (filter, { db }) => {
  const data = await db.collection('question').find({ group: groupId.toString(), destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
    options: entry.options ? JSON.parse(JSON.stringify(entry.options)) : null,
  }));
};

const PageGroups = pageId => async (filter, { db }) => {
  const data = await db.collection('group').find({ page: pageId.toString(), destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
    questions: GroupQuestions(entry._id),
  }));
};

const QuestionnairePages = questionnaireId => async (filter, { db }) => {
  const data = await db.collection('page').find({ questionnaire: questionnaireId, destroyed: false }).toArray();

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
    groups: PageGroups(entry._id),
  }));
};

const dashboardLayouts = dashboardId => async (filter, { db }) => {
  const data = await db.collection('layout').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return null; }

  const layout = data.shift();
  return Object.assign({}, layout, {
    id: layout._id,
  });
};

const dashboardCps = dashboardId => async (filter, { db }) => {
  const data = await db.collection('cp').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const dashboardCpds = dashboardId => async (filter, { db }) => {
  const data = await db.collection('cpd').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const dashboardAliases = dashboardId => async (filter, { db }) => {
  const data = await db.collection('alias').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const dashboardCharts = dashboardId => async (filter, { db }) => {
  const data = await db.collection('chart').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const dashboardConstants = dashboardId => async (filter, { db }) => {
  const data = await db.collection('constant').find({ dashboard: dashboardId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
  }));
};

const QuestionnaireDashboards = questionnaireId => async (
  filter,
  { db },
) => {
  const data = await db.collection('dashboard').find({ questionnaire: questionnaireId, destroyed: false }).toArray();

  if (!data) { return []; }

  return data.map(entry => Object.assign({}, entry, {
    id: entry._id,
    layout: dashboardLayouts(entry._id.toString()),
    cps: dashboardCps(entry._id.toString()),
    cpds: dashboardCpds(entry._id.toString()),
    aliases: dashboardAliases(entry._id.toString()),
    charts: dashboardCharts(entry._id.toString()),
    constants: dashboardConstants(entry._id.toString()),
  }));
};

export const questionnaire = async (
  { questionnaire: questionnaireEntry } = {},
  { id },
  { db, ObjectId },
) => {
  const data = await db.collection('questionnaire').findOne({ _id: new ObjectId(id), destroyed: false });

  return Object.assign({}, data, {
    id,
    pages: QuestionnairePages(id || questionnaireEntry),
    dashboards: QuestionnaireDashboards(id || questionnaireEntry),
  });
};

const questionnaires = async ({ filter = {} }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('questionnaires')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
    pages: QuestionnairePages(entry.questionnaire),
  }));
};

const root = {
  questionnaire,
  questionnaires,
};

const nested = {
  questionnaire: {
    pages: async ({ id }, args, { db }) => {
      const data = await db.collection('page').find({ questionnaire: id.toString(), destroyed: false }).toArray();
      return data.map(entry => Object.assign({}, entry, {
        id: entry._id,
      }));
    },
  },
};

export {
  type, queries, root, nested,
};
