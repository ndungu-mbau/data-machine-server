/* eslint-disable no-underscore-dangle */
const collection = 'roles';

const create = async (args, { db, ObjectId }) => {
  const entry = args;
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false,
  });
  db.collection(collection).insertOne(entry);
  entry.id = entry._id;
  return entry;
};

// const create = async (
//   { newRole: { userId, clientId, name } },
//   { db, ObjectId },
// ) => {
//   const roleObj = {
//     _id: new ObjectId(),
//     userId,
//     clientId,
//     name,
// //     destroyed: false,
// //   };

//   const res = await db.collection(collection).insertOne(roleObj);

//   const client = await db
//     .collection('company')
//     .findOne({ _id: new ObjectId(res.ops[0].clientId) });

//   const user = await db
//     .collection('user')
//     .findOne({ _id: new ObjectId(res.ops[0].userId) });

//   return {
//     id: res.ops[0]._id,
//     user: { id: user._id, ...user },
//     client: { id: client._id, ...client },
//   };
// };

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection];
  const { id } = entry;
  delete entry.id;
  return db
    .collection(collection)
    .updateOne({ _id: new ObjectId(id) }, { $set: entry });
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
