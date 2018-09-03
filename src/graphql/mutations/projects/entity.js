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
};
