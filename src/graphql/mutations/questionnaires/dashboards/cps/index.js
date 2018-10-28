import { create, update, destroy, restore } from './entity';

const type = `
  input newcp {
    id: String,
    name: String,
    dashboard: String,
    formular: String,
    field: String,
    type: String
  }

  type cpMutations {
    create (cp:newcp!):cp,
    update (cp:newcp):cp,
    destroy (cp:newcp):cp,
    restore (cp:newcp):cp
  }
`;

const queries = `
  cpMutations:cpMutations
`;

const root = {
  cpMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
