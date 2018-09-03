const create = async ({ team }, { datastore }) => {
  const key = datastore.key('teams');
  await datastore.save({
    key,
    data: Object.assign({}, team, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, team, {
    id,
  });
};

const addUser = async ({ team, user }, { datastore }) => {
  const key = datastore.key('user_teams');
  await datastore.save({
    key,
    data: Object.assign({}, { team, user }, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return id
};

const update = async ({ team }, { datastore }) => {
  const { id } = team;
  const key = {
    kind: 'teams',
    path: ['teams', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, team, {
      id: undefined,
      destroyed: false
    }),
  });

  return Object.assign(team, {
    id,
  });
};

const destroy = async ({ team }, { datastore }) => {
  const { id } = team;
  const key = {
    kind: 'teams',
    path: ['teams', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, team, {
    id,
  });
};

const restore = async ({ team }, { datastore }) => {
  const { id } = team;
  const key = {
    kind: 'teams',
    path: ['teams', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, team, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, team, {
    id,
  });
};

export {
  create,
  update,
  destroy,
  restore,
  addUser
};
