const create = async ({ question }, { datastore }) => {
  const key = datastore.key('questions');
  const { options } = question

  // question.options = JSON.stringify(question.options)

  await datastore.save({
    key,
    data: Object.assign({}, question, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, question, {
    id,
  });
};

const update = async ({ question }, { datastore }) => {
  const { id } = question;
  const key = {
    kind: 'questions',
    path: ['questions', id],
    id,
  };

  // question.options = JSON.stringify(question.options)

  await datastore.save({
    key,
    data: Object.assign({}, question, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(question, {
    id,
  });
};

const destroy = async ({ question }, { datastore }) => {
  const { id } = question;
  const key = {
    kind: 'questions',
    path: ['questions', id],
    id,
  };

  await datastore.delete(key);

  console.log('destroyed')

  return Object.assign({}, question, {
    id,
  });
};

const restore = async ({ question }, { datastore }) => {
  const { id } = question;
  const key = {
    kind: 'questions',
    path: ['questions', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, question, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, question, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
