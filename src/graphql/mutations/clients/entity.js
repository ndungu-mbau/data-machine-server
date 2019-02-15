const collection = "client"

const create = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  Object.assign(entry, {
    _id: new ObjectId(),
    destroyed: false
  })
  db.collection(collection).insertOne(entry)
  entry.id = entry._id
  return entry
};

const update = async (args, { db, ObjectId }) => {
  const entry = args[collection]
  const companyChange = Object.assign({}, entry, {
    id: undefined,
    company_name:entry.name,
    company_registration_id: entry.reg_id,
    company_email: entry.contact_email,
    company_contact: entry.comms_sms,
    contact: entry.comms_sms
  })
  
  db.collection('company').updateOne({
    _id: new ObjectId(entry.id)
  }, {
      $set: companyChange
    })

  return await db.collection(collection).updateOne({
    _id: new ObjectId(entry.id)
  }, {
      $set: Object.assign({}, entry, {
        id: undefined
      })
    })
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
