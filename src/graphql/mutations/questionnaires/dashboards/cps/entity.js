const create = async ({ cp }, { datastore }) => {
  const key = datastore.key('cps');
  await datastore.save({
    key,
    data: Object.assign({}, cp, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, cp, {
    id,
  });
};

const update = async ({ cp }, { datastore }) => {
  const { id } = cp;
  const key = {
    kind: 'cps',
    path: ['cps', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, cp, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(cp, {
    id,
  });
};

const destroy = async ({ cp }, { datastore }) => {
  const { id } = cp;
  const key = {
    kind: 'cps',
    path: ['cps', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, cp, {
    id,
  });
};

const restore = async ({ cp }, { datastore }) => {
  const { id } = cp;
  const key = {
    kind: 'cps',
    path: ['cps', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, cp, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, cp, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
