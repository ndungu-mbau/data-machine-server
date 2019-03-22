import { created, update } from './entity';

const type = `
    input newRole {
      id: String,
      companyId: String,
      userId:String,
      role:String,
      permissions:[String]
    }
  
    type roleMutations {
      created (role:newRole!):role,
      update (role:newRole):role,
    
    }
  `;

const queries = `
roleMutations:roleMutations
  `;

const root = {
  roleMutations: {
    created,
    update,
  },
};

export { type, queries, root };
