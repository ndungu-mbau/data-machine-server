const create = async ({ questionnaire }, { datastore }) => {
  const key = datastore.key('questionnaires');
  await datastore.save({
    key,
    data: Object.assign({}, questionnaire, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, questionnaire, {
    id,
  });
};

const update = async ({ questionnaire }, { datastore }) => {
  const { id } = questionnaire;
  const key = {
    kind: 'questionnaires',
    path: ['questionnaires', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, questionnaire, {
      id: undefined,
      destroyed: false
    }),
  });

  return Object.assign(questionnaire, {
    id,
  });
};

const destroy = async ({ questionnaire }, { datastore }) => {
  const { id } = questionnaire;
  const key = {
    kind: 'questionnaires',
    path: ['questionnaires', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, questionnaire, {
    id,
  });
};

const restore = async ({ questionnaire }, { datastore }) => {
  const { id } = questionnaire;
  const key = {
    kind: 'questionnaires',
    path: ['questionnaires', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, questionnaire, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, questionnaire, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
