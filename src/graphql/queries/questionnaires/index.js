const type = `
  type questionnaire {
    id: String,
    name: String,
    project:project,
    pages:[page],
    dashboards:[dashboard]
  }
`;

const queries = `
  questionnaire(id:String):questionnaire,
  questionnaires(filter:filter):[questionnaire]
`;

const QuestionOptions = questionId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('options')
    .filter('question', questionId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }));
};

const GroupQuestions = groupId => async (filter, { db }) => {
  console.log(groupId);
  const data = await db.collection('question').find({ group: groupId.toString(), destroyed: false }).toArray();

  return data.map(entry =>
    Object.assign({}, entry, {
      id: entry._id,
      options: entry.options ? JSON.parse(JSON.stringify(entry.options)) : null,
    }));
};

const PageGroups = pageId => async (filter, { db }) => {
  const data = await db.collection('group').find({ page: pageId.toString(), destroyed: false }).toArray();

  return data.map(entry =>
    Object.assign({}, entry, {
      id: entry._id,
      questions: GroupQuestions(entry._id),
    }));
};

const QuestionnairePages = questionnaireId => async (filter, { db }) => {
  const data = await db.collection('page').find({ questionnaire: questionnaireId, destroyed: false }).toArray();

  return data.map(entry =>
    Object.assign({}, entry, {
      id: entry._id,
      groups: PageGroups(entry._id),
    }));
};

const dashboardLayouts = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('layouts')
    .filter('dashboard', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  const layout = entities.shift().shift();
  return Object.assign({}, layout, {
    id: layout[datastore.KEY].id,
  });
};

const dashboardCps = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('cps')
    .filter('dashboard', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }));
};

const dashboardAliases = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('aliases')
    .filter('dashboard', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }));
};

const dashboardCharts = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('charts')
    .filter('dashboard', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }));
};

const dashboardConstants = dashboardId => async (filter, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('constants')
    .filter('dashboard', dashboardId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
    }));
};

const QuestionnaireDashboards = questionnaireId => async (
  filter,
  { datastore },
) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore
    .createQuery('dashboards')
    .filter('questionnaire', questionnaireId)
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);

  const entities = await datastore.runQuery(query);

  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
      layout: dashboardLayouts(entry[datastore.KEY].id),
      cps: dashboardCps(entry[datastore.KEY].id),
      aliases: dashboardAliases(entry[datastore.KEY].id),
      charts: dashboardCharts(entry[datastore.KEY].id),
      constants: dashboardConstants(entry[datastore.KEY].id),
    }));
};

export const questionnaire = async ({ questionnaire } = {}, { id }, { db, ObjectId }) => {
  const data = await db.collection('questionnaire').findOne({ _id: new ObjectId(id), destroyed: false });

  return Object.assign({}, data, {
    id,
    pages: QuestionnairePages(id || questionnaire),
    dashboards: QuestionnaireDashboards(id || questionnaire),
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
  return entities.shift().map(entry =>
    Object.assign({}, entry, {
      id: entry[datastore.KEY].id,
      pages: QuestionnairePages(entry.questionnaire),
    }));
};

const root = {
  questionnaire,
  questionnaires,
};

export { type, queries, root };
