const collection = "project"

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false
  })

  if (entry.questionnaire === 'new') {
    const questionnaire = {
      _id: new ObjectId,
      name: entry.name,
      project: entry._id.toString(),
      destroyed: false
    }

    console.log(questionnaire)

    await db.collection('questionnaire').insertOne(questionnaire)
    entry.questionnaire = questionnaire._id
  }
  db.collection(collection).insertOne(entry)
  entry.id = entry._id
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

export {
  create,
  update,
  destroy,
  restore,
};
