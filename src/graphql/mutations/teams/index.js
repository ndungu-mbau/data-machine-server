import {
  create,
  update,
  destroy,
  restore,
  addUser,
  removeUser
} from './entity';

const type = `
  input newteam {
    id: String,
    name: String!,
    description: String,
    client: String!
  }

  type teamMutations {
    create (team:newteam!):team,
    update (team:newteam):team,
    destroy (team:newteam):team,
    restore (team:newteam):team,
    addUser (user:String,team:String):String
    removeUser (user:String,team:String):String
  }
`;

const queries = `
  teamMutations:teamMutations
`;


const root = {
  teamMutations: () => ({
    create,
    update,
    destroy,
    restore,
    addUser,
    removeUser
  }),
};

export {
  type,
  queries,
  root,
};
