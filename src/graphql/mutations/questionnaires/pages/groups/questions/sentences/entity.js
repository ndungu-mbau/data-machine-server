const create = async ({ sentence }, { datastore }) => {
  const key = datastore.key('sentences');
  await datastore.save({
    key,
    data: Object.assign({}, sentence, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, sentence, {
    id,
  });
};

const update = async ({ sentence }, { datastore }) => {
  const { id } = sentence;
  const key = {
    kind: 'sentences',
    path: ['sentences', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, sentence, {
      id: undefined,
    }),
  });

  return Object.assign(sentence, {
    id,
  });
};

const destroy = async ({ sentence }, { datastore }) => {
  const { id } = sentence;
  const key = {
    kind: 'sentences',
    path: ['sentences', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, sentence, {
    id,
  });
};

const restore = async ({ sentence }, { datastore }) => {
  const { id } = sentence;
  const key = {
    kind: 'sentences',
    path: ['sentences', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, sentence, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, sentence, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
