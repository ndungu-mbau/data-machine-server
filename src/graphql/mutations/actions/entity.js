/* eslint-disable no-underscore-dangle */
const collection = 'action';

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
  const { id } = entry;
  delete entry.id;

  if (id) {
    Object.assign(entry, {
      _id: new ObjectId(id),
      destroyed: false,
    });
  }

  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(id) }, { $set: entry }, { upsert: true });
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: Object.assign({}, entry, { id: undefined, destroyed: true }) },
    );
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: Object.assign({}, entry, { id: undefined, destroyed: false }) },
    );
};

export {
  create, update, destroy, restore,
};
