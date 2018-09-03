const create = async ({ layout }, { datastore }) => {
  const key = datastore.key('layouts');
  await datastore.save({
    key,
    data: Object.assign({}, layout, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, layout, {
    id,
  });
};

const update = async ({ layout }, { datastore }) => {
  const { id } = layout;
  const key = {
    kind: 'layouts',
    path: ['layouts', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, layout, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(layout, {
    id,
  });
};

const destroy = async ({ layout }, { datastore }) => {
  const { id } = layout;
  const key = {
    kind: 'layouts',
    path: ['layouts', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, layout, {
    id,
  });
};

const restore = async ({ layout }, { datastore }) => {
  const { id } = layout;
  const key = {
    kind: 'layouts',
    path: ['layouts', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, layout, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, layout, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
