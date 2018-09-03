const type = `
  type user {
    id: String,
    firstName: String,
    middleName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    mobileMoneyNumber: String,
    password: String,
    firstName: String,
  }
`;

const queries = `
  user(id:String):user,
  users(filter:filter):[user]
`;

const user = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'users',
    path: ['users', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const users = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('users')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  user,
  users,
};

export {
  type,
  queries,
  root,
};
