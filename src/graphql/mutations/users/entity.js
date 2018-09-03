const create = async ({ user }, { datastore }) => {
  const key = datastore.key('users');
  await datastore.save({
    key,
    data: Object.assign({}, user, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, user, {
    id,
  });
};

const update = async ({ user }, { datastore }) => {
  const { id } = user;
  const key = {
    kind: 'users',
    path: ['users', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, user, {
      id: undefined,
    }),
  });

  return Object.assign(user, {
    id,
  });
};

const destroy = async ({ user }, { datastore }) => {
  const { id } = user;
  const key = {
    kind: 'users',
    path: ['users', id],
    id,
  };

  await datastore.delete(key);


  return Object.assign({}, user, {
    id,
  });
};

const restore = async ({ user }, { datastore }) => {
  const { id } = user;
  const key = {
    kind: 'users',
    path: ['users', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, user, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, user, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
