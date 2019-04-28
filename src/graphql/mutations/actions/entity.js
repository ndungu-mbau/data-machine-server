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

  const _id = id ? new ObjectId(id) : new ObjectId();

  Object.assign(entry, {
    destroyed: false,
  });

  await db
    .collection(collection)
    .updateOne({
      _id,
    }, { $set: entry }, { upsert: true });

  return {
    id: _id,
  };
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

const updateOrder = async ({
  id,
  project,
  name,
  client,
  order,
}, { db, ObjectId }) => {
  const _id = id ? new ObjectId() : new ObjectId(id);

  await db
    .collection('events')
    .updateOne(
      {
        project,
        client,
        name,
      },
      {
        $set: {
          name,
          order,
          project,
          client,
          destroyed: false,
        },
      },
      { upsert: true },
    );

  return {
    id: _id,
  };
};

export {
  create, update, destroy, restore, updateOrder,
};
