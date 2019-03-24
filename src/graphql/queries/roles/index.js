/* eslint-disable no-underscore-dangle */

const type = `
  type role {
    id: String,
    userId: String,
    companyId:String,
    role:String,
    permissions:[String]
  }
`;

const queries = `
  role(id:String!):role,
  roles(filter:filter!):[role]
`;

const role = async (x, { id }, { db, ObjectId }) => {
  const data = await db
    .collection('roles')
    .find({ _id: ObjectId(id) })
    .toArray();
  return {
    id: data[0]._id,
    companyId: data[0].companyId,
    userId: data[0].userId,
  };
};

const roles = () => [];

const root = {
  role,
  roles,
};

export { type, queries, root };
