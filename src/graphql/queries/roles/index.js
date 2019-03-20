import { ObjectId } from "mongodb";
import { from } from "apollo-link";
const type = `
  type role {
  id: String,
  userId: String,
  companyId:String,
  role:String

  }


`;

const queries = `
  role(id:String!):role,
  roles(filter:filter!):[role]
`;

const role = async (x, { id }, { db, ObjectId }) => {
  console.log(id);
  const data = await db
    .collection("roles")
    .find({ _id: ObjectId(id) })
    .toArray();
  console.log(data[0]._id);
  return {
    id: data[0]._id,
    companyId: data[0].companyId,
    userId: data[0].userId
  };
};

const roles = async args => {
  console.log("called");
  console.log(id);
  return [role];
};

const root = {
  role,
  roles
};

export { type, queries, root };
