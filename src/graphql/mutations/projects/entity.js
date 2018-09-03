const create = async ({ project }, { datastore }) => {
  const questionnaireKey = datastore.key('questionnaires');
  const key = datastore.key('projects');

  await datastore.save({
    key: questionnaireKey,
    data: Object.assign({}, {
      destroyed: false,
      id: undefined,
      name: `${project.name} Questionnaire V1`
    }),
  });

  await datastore.save({
    key,
    data: Object.assign({}, project, {
      destroyed: false,
      id: undefined,
      questionnaire: questionnaireKey.id
    }),
  });

  const { id } = key;
  return Object.assign({}, project, {
    id,
  });
};

const addTeam = async ({ project, team }, { datastore }) => {
  // check if user is part of that team already
  const query = datastore.createQuery('project_teams')
    .filter('team', team)
    .filter('project', project)
    .limit('limit', 1);

  const entities = await datastore.runQuery(query);

  const existingRelationship = entities.shift()

  console.log({ existingRelationship })
  if (existingRelationship[0])
    return existingRelationship[0][datastore.KEY].id

  const key = datastore.key('project_teams');
  await datastore.save({
    key,
    data: Object.assign({}, { project, team }, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return id
};

const removeTeam = async ({ project, team }, { datastore }) => {
  const query = datastore.createQuery('project_teams')
    .filter('team', team)
    .filter('project', project)
    .limit('limit', 1);

  const entities = await datastore.runQuery(query);

  const [existingRelationship] = entities.shift()

  if (existingRelationship) {
    const key = {
      kind: 'project_teams',
      path: ['project_teams', existingRelationship[datastore.KEY].id],
      id: existingRelationship[datastore.KEY].id,
    };

    await datastore.delete(key);

    return existingRelationship[datastore.KEY].id
  }

  return null
};

const update = async ({ project }, { datastore }) => {
  const { id } = project;

  const key = {
    kind: 'projects',
    path: ['projects', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, project, {
      id: undefined,
      destroyed: false
    }),
  });

  return Object.assign(project, {
    id,
  });
};

const destroy = async ({ project }, { datastore }) => {
  const { id } = project;
  const key = {
    kind: 'projects',
    path: ['projects', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, project, {
    id,
  });
};

const restore = async ({ project }, { datastore }) => {
  const { id } = project;
  const key = {
    kind: 'projects',
    path: ['projects', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, project, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, project, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
  addTeam,
  removeTeam
};
