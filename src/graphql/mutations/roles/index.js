import {
  create, update, destroy, restore,
} from './entity';

const type = `
  input newRole{
    id: String,
    clientId:String,
    name:String,
    permissions:[String]
  }

  type roleMutations {
    create (role:newRole!):role,
    update (role:newRole!):role,
  }
`;

const queries = `
  roleMutations:roleMutations
`;

const root = {
  roleMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
