import { ObjectId } from  'mongodb'
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

const role = async (x,{id},{db}) => {
if (id.length > 0 ){  
  const res= await db.collection("roles").findOne({"_id": ObjectId("5c7f912df4a28e43bc7e65da")})
  console.log(res._id)
   return { id:res._id,userId:res.UserId ,role:res.role ,companyId:res.companyId }
}


};


const roles = async (args) => {
  console.log("called")
  console.log(id)
  return [role]
  };

const root={
  role,
  roles
}



export {
  type,
 queries,
 root
};
