import sha1 from "sha1";

const collection = "roles";

const created = async ({ companyId, userId, role }, { db, ObjectId }) => {
  let roleObj = {
    _id: ObjectId(),
    companyId: companyId,
    userId: userId,
    role: role.role
  };

  let res = await db.collection(collection).insertOne(role);
  return { id: roleObj._id, ...res.ops[0] };
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return {};
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: true } });
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: false } });
};

export { created, update, destroy, restore };
