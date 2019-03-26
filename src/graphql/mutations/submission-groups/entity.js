const collection = "submissionGroup"

const create = (args, { db, ObjectId }) => {
  const entry = args[collection]
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false
  })
  entry.id = entry._id
  db.collection(collection).insertOne(entry)
  return entry
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  return await db.collection(collection).updateOne({ _id: new ObjectId(entry.id) }, { $set: Object.assign({}, entry, { id: undefined }) })
};

const destroy = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  return await db.collection(collection).updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: true } })
};

const restore = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  return await db.collection(collection).updateOne({ _id: new ObjectId(entry.id) }, { $set: { destroyed: false } })
};

const addSubmission = async (args, { db }) => await db.collection("submission-group-submissions").insertOne(args)

const removeSubmission = async (args, { db }) => await db.collection("submission-group-submissions").deleteOne(args)

export default {
  create,
  update,
  destroy,
  restore,
  addSubmission,
  removeSubmission
}