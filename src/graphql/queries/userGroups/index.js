const type = `
  type userGroup {
    id: String,
    name: String
  }
`;

const queries = `
  userGroup(id:String):userGroup,
  userGroups(filter:filter):[userGroup]
`;

const userGroup = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'userGroups',
    path: ['userGroups', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const userGroups = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('userGroups')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  userGroup,
  userGroups,
};

export {
  type,
  queries,
  root,
};
