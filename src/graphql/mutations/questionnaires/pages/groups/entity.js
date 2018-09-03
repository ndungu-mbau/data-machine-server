const create = async ({ group }, { datastore }) => {
  const key = datastore.key('groups');
  await datastore.save({
    key,
    data: Object.assign({}, group, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, group, {
    id,
  });
};

const update = async ({ group }, { datastore }) => {
  const { id } = group;
  const key = {
    kind: 'groups',
    path: ['groups', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, group, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(group, {
    id,
  });
};

const destroy = async ({ group }, { datastore }) => {
  const { id } = group;
  const key = {
    kind: 'groups',
    path: ['groups', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, group, {
    id,
  });
};

const restore = async ({ group }, { datastore }) => {
  const { id } = group;
  const key = {
    kind: 'groups',
    path: ['groups', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, group, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, group, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
};
