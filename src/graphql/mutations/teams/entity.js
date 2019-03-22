/* eslint-disable no-underscore-dangle */
const collection = 'team';

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false,
  });
  db.collection(collection).insertOne(entry);
  entry.id = entry._id;
  return entry;
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection).updateOne(
    { _id: new ObjectId(entry.id) },
    { $set: Object.assign({}, entry, { id: undefined }) },
  );
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: { destroyed: true } },
    );
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: { destroyed: false } },
    );
};

const addUser = async (args, { db }) => db.collection('user_teams').insertOne(args);

const removeUser = async (args, { db }) => db.collection('user_teams').deleteOne(args);

const addProject = async (args, { db }) => db.collection('project_teams').insertOne(args);

const removeProject = async (args, { db }) => db.collection('project_teams').deleteOne(args);

export {
  create,
  update,
  destroy,
  restore,
  addUser,
  removeUser,
  addProject,
  removeProject,
};
