const create = async ({ option }, { datastore }) => {
  const key = datastore.key('options');
  await datastore.save({
    key,
    data: Object.assign({}, option, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, option, {
    id,
  });
};

const update = async ({ option }, { datastore }) => {
  const { id } = option;
  const key = {
    kind: 'options',
    path: ['options', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, option, {
      id: undefined,
    }),
  });

  return Object.assign(option, {
    id,
  });
};

const destroy = async ({ option }, { datastore }) => {
  const { id } = option;
  const key = {
    kind: 'options',
    path: ['options', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, option, {
    id,
  });
};

const restore = async ({ option }, { datastore }) => {
  const { id } = option;
  const key = {
    kind: 'options',
    path: ['options', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, option, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, option, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
