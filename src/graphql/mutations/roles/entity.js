/* eslint-disable no-underscore-dangle */
const collection = 'roles';

const created = async ({ companyId, userId, role }, { db, ObjectId }) => {
  const roleObj = {
    _id: ObjectId(),
    companyId,
    userId,
    role: role.role,
  };

  const res = await db.collection(collection).insertOne(role);
  return { id: roleObj._id, ...res.ops[0] };
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  const { id } = entry;
  delete entry.id;
  return db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: entry });
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

export { created, update, destroy, restore };
