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
  // check if user is part of that team already
  const query = datastore.createQuery('user_teams')
    .filter('team', team)
    .filter('destroyed', false)
    .limit('limit', 1);

  const entities = await datastore.runQuery(query);

  const existingRelationship = entities.shift()

  console.log({ existingRelationship })
  if (existingRelationship[0])
    return existingRelationship[0][datastore.KEY].id

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

const removeUser = async ({ team, user }, { datastore }) => {
  const query = datastore.createQuery('user_teams')
    .filter('team', team)
    .filter('destroyed', false)
    .limit('limit', 1);

  const entities = await datastore.runQuery(query);

  const [existingRelationship] = entities.shift()

  console.log(existingRelationship)

  if (existingRelationship) {
    const key = {
      kind: 'user_teams',
      path: ['user_teams', existingRelationship[datastore.KEY].id],
      id: existingRelationship[datastore.KEY].id,
    };

    await datastore.delete(key);

    return existingRelationship[datastore.KEY].id
  }

  return null
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
  removeUser,
  update,
  destroy,
  restore,
  addUser
};
