const create = async ({ chart }, { datastore }) => {
  const key = datastore.key('charts');
  await datastore.save({
    key,
    data: Object.assign({}, chart, {
      destroyed: false,
      id: undefined,
    }),
    excludeFromIndexes: [
      'html'
    ]
  });
  const { id } = key;
  return Object.assign({}, chart, {
    id,
  });
};

const update = async ({ chart }, { datastore }) => {
  const { id } = chart;
  const key = {
    kind: 'charts',
    path: ['charts', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, chart, {
      id: undefined,
      destroyed: false,
    }),
    excludeFromIndexes: [
      'html'
    ]
  });

  return Object.assign(chart, {
    id,
  });
};

const destroy = async ({ chart }, { datastore }) => {
  const { id } = chart;
  const key = {
    kind: 'charts',
    path: ['charts', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, chart, {
    id,
  });
};

const restore = async ({ chart }, { datastore }) => {
  const { id } = chart;
  const key = {
    kind: 'charts',
    path: ['charts', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, chart, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, chart, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
