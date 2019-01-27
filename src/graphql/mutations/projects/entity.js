const collection = "project"

const create = async (args, { db, ObjectId }) => {

  console.log(ObjectId)
  const entry = args[collection]
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false
  })

  const questionnaire = {
    _id: new ObjectId(),
    name: entry.name,
    project: entry._id.toString(),
    destroyed: false
  }

  await db.collection('questionnaire').insertOne(questionnaire)
  entry.questionnaire = questionnaire._id

  await db.collection(collection).insertOne(entry)
  entry.id = entry._id

  const page = {
    _id: new ObjectId(),
    name: 'Sample page',
    questionnaire: questionnaire._id.toString(),
    destroyed: false
  }

  // create questionnire things
  await db.collection('page').insertOne(page);

  const group = {
    _id: new ObjectId(),
    name: 'Sample group',
    page: page._id.toString(),
    destroyed: false
  }

  // create questionnire things
  await db.collection('group').insertOne(group);

  const question = {
    _id: new ObjectId(),
    type: 'instruction',
    placeholder: 'Sample instruction',
    group: group._id.toString(),
    destroyed: false
  }

  // create questionnire things
  await db.collection('question').insertOne(question);

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
