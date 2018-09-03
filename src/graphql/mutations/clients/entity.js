const create = async ({ client }, { datastore }) => {
  const key = datastore.key('clients');
  await datastore.save({
    key,
    data: Object.assign({}, client, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, client, {
    id,
  });
};

const update = async ({ client }, { datastore }) => {
  const { id } = client;
  const key = {
    kind: 'clients',
    path: ['clients', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, client, {
      id: undefined,
      destroyed: false
    }),
  });

  return Object.assign(client, {
    id,
  });
};

const destroy = async ({ client }, { datastore }) => {
  const { id } = client;
  const key = {
    kind: 'clients',
    path: ['clients', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, client, {
    id,
  });
};

const restore = async ({ client }, { datastore }) => {
  const { id } = client;
  const key = {
    kind: 'clients',
    path: ['clients', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, client, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, client, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
