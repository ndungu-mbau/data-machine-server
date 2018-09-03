const create = async ({ page }, { datastore }) => {
  const key = datastore.key('pages');
  await datastore.save({
    key,
    data: Object.assign({}, page, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, page, {
    id,
  });
};

const update = async ({ page }, { datastore }) => {
  const { id } = page;
  const key = {
    kind: 'pages',
    path: ['pages', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, page, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(page, {
    id,
  });
};

const destroy = async ({ page }, { datastore }) => {
  const { id } = page;
  const key = {
    kind: 'pages',
    path: ['pages', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, page, {
    id,
  });
};

const restore = async ({ page }, { datastore }) => {
  const { id } = page;
  const key = {
    kind: 'pages',
    path: ['pages', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, page, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, page, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
