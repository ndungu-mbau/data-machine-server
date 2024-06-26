/* eslint-disable no-underscore-dangle */
const collection = 'sentense';

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  entry._id = new ObjectId();
  db.collection(collection).insertOne(entry);
  entry.id = entry._id;
  return entry;
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: Object.assign({}, entry, { id: undefined }) },
    );
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: Object.assign({}, entry, { id: undefined, destroyed: true }) },
    );
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne(
      { _id: new ObjectId(entry.id) },
      { $set: Object.assign({}, entry, { id: undefined, destroyed: false }) },
    );
};

export {
  create,
  update,
  destroy,
  restore,
};
