import sha1 from 'sha1';

const collection = 'user';

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection];

  // check if there is an entry with that phoneNumber
  const existingUser = await db.collection(collection).findOne({ phoneNumber: entry.phoneNumber })
  if (existingUser) {
    existingUser.id = existingUser._id;
    return existingUser;
  } else {
    Object.assign(entry, {
      _id: new ObjectId(),
      client: new ObjectId(entry.client),
      destroyed: false,
    });
    entry.password = sha1(entry.password);
    db.collection(collection).insertOne(entry);
    entry.id = entry._id;
    return entry;
  }
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  if (entry.password) { entry.password = sha1(entry.password); }
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: Object.assign({}, entry, { id: undefined }) });
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: true } });
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db.collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: false } });
};

export {
  create,
  update,
  destroy,
  restore,
};
