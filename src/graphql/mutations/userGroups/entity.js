const create = async ({ userGroup }, { datastore }) => {
  const key = datastore.key('userGroups');
  await datastore.save({
    key,
    data: Object.assign({}, userGroup, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, userGroup, {
    id,
  });
};

const update = async ({ userGroup }, { datastore }) => {
  const { id } = userGroup;
  const key = {
    kind: 'userGroups',
    path: ['userGroups', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, userGroup, {
      id: undefined,
    }),
  });

  return Object.assign(userGroup, {
    id,
  });
};

const destroy = async ({ userGroup }, { datastore }) => {
  const { id } = userGroup;
  const key = {
    kind: 'userGroups',
    path: ['userGroups', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, userGroup, {
    id,
  });
};

const restore = async ({ userGroup }, { datastore }) => {
  const { id } = userGroup;
  const key = {
    kind: 'userGroups',
    path: ['userGroups', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, userGroup, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, userGroup, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
