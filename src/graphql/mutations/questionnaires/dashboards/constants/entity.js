const create = async ({ constant }, { datastore }) => {
  const key = datastore.key('constants');
  await datastore.save({
    key,
    data: Object.assign({}, constant, {
      destroyed: false,
      id: undefined,
    }),
  });
  const { id } = key;
  return Object.assign({}, constant, {
    id,
  });
};

const update = async ({ constant }, { datastore }) => {
  const { id } = constant;
  const key = {
    kind: 'constants',
    path: ['constants', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, constant, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign(constant, {
    id,
  });
};

const destroy = async ({ constant }, { datastore }) => {
  const { id } = constant;
  const key = {
    kind: 'constants',
    path: ['constants', id],
    id,
  };

  await datastore.delete(key);

  return Object.assign({}, constant, {
    id,
  });
};

const restore = async ({ constant }, { datastore }) => {
  const { id } = constant;
  const key = {
    kind: 'constants',
    path: ['constants', id],
    id,
  };

  await datastore.save({
    key,
    data: Object.assign({}, constant, {
      id: undefined,
      destroyed: false,
    }),
  });

  return Object.assign({}, constant, {
    id,
  });
};

export { create, update, destroy, restore };
