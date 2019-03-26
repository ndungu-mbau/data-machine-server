const type = `
  type submissionGroup {
    id: String,
    name: String,
    destroyed: Boolean,
    submissionGroupSubmissions: [submissionGroupSubmissions]
  }

  type submissionGroupSubmissions{
    submissionGroup: String,
    sumbission: String
  }

  input filter {
    destroyed: Boolean,
    offset: String,
    limit:String
  }
`;

const queries = `
  submissionGroups(): [submissionGroup]
  submissionGroup(id: String): submissionGroup
`;

const submissionGroup = async (_, { id }, { db, ObjectId }) => {
  return await db.collection("submissionGroup").findOne({ _id: new ObjectId(id) })
}

const submissionGroups = async (_, { destroyed }, { db }) => {
  return await db.collection("submissionGroup").find({ destroyed }).toArray()
}

const root = {
  submissionGroup,
  submissionGroups
}

const nested = {
  submissionGroupSubmissions: ({ id }, _, { db, ObjectId }) => {
    return db.collection("submission-group-submissions").find({ submissionGroup : new ObjectId(id)}).toArray
  }
}

export default {
  type,
  queries,
  root,
  nested
}