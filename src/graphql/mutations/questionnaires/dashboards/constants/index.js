import { create, update, destroy, restore } from './entity';

const type = `
  input newconstant {
    id: String,
    name: String,
    dashboard: String,
    value: String,
  }

  type constantMutations {
    create (constant:newconstant!):constant,
    update (constant:newconstant):constant,
    destroy (constant:newconstant):constant,
    restore (constant:newconstant):constant
  }
`;

const queries = `
  constantMutations:constantMutations
`;

const root = {
  constantMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
