const create = async ({ dashboard }, { datastore }) => {
  const key = datastore.key('dashboards');
  await datastore.save({
    key,
    data: Object.assign({}, dashboard, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, dashboard, {
    id,
  });
};

const update = async ({ dashboard }, { datastore }) => {
  const { id } = dashboard;
  const key = {
    kind: 'dashboards',
    path: ['dashboards', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, dashboard, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(dashboard, {
    id,
  });
};

const destroy = async ({ dashboard }, { datastore }) => {
  const { id } = dashboard;
  const key = {
    kind: 'dashboards',
    path: ['dashboards', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, dashboard, {
    id,
  });
};

const restore = async ({ dashboard }, { datastore }) => {
  const { id } = dashboard;
  const key = {
    kind: 'dashboards',
    path: ['dashboards', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, dashboard, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, dashboard, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
