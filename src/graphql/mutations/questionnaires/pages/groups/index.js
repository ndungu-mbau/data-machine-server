import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newgroup {
    id: String,
    name: String,
    page:String
  }

  type groupMutations {
    create (group:newgroup!):group,
    update (group:newgroup):group,
    destroy (group:newgroup):group,
    restore (group:newgroup):group
  }
`;

const queries = `
  groupMutations:groupMutations
`;


const root = {
  groupMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export {
  type,
  queries,
  root,
};
