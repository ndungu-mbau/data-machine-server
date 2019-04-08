const type = `
  type submissionGroup {
    id: String,
    name: String,
    destroyed: Boolean,
    submissions: [String]
  }
`;

const queries = `
  submissionGroups(filter:filter!): [submissionGroup]
  submissionGroup(id: String): submissionGroup
`;

const submissionGroup = async (_, { id }, { db, ObjectId }) => db.collection('submissionGroup').findOne({ _id: new ObjectId(id) });

const submissionGroups = async (_, { destroyed }, { db }) => db.collection('submissionGroup').find({ destroyed }).toArray();

const root = {
  submissionGroup,
  submissionGroups,
};

const nested = {};

export {
  type,
  queries,
  root,
  nested,
};
