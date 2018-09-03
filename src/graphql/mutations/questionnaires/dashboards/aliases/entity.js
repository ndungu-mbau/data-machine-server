const create = async ({ alias }, { datastore }) => {
  const key = datastore.key('aliases');
  await datastore.save({
    key,
    data: Object.assign({}, alias, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, alias, {
    id,
  });
};

const update = async ({ alias }, { datastore }) => {
  const { id } = alias;
  const key = {
    kind: 'aliases',
    path: ['aliases', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, alias, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(alias, {
    id,
  });
};

const destroy = async ({ alias }, { datastore }) => {
  const { id } = alias;
  const key = {
    kind: 'aliases',
    path: ['aliases', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, alias, {
    id,
  });
};

const restore = async ({ alias }, { datastore }) => {
  const { id } = alias;
  const key = {
    kind: 'aliases',
    path: ['aliases', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, alias, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, alias, {
    id,
  });
};

export { create, update, destroy, restore };
