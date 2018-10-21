import { create, update, destroy, restore } from './entity';

const type = `
  input newcpd {
    id: String,
    name: String,
    dashboard: String,
    numerator:String,
    sum: [String],
    difference: [String],
    division: [String],
    multiply: [String],
    average: [String],
  }

  type cpdMutations {
    create (cp:newcp!):cp,
    update (cp:newcp):cp,
    destroy (cp:newcp):cp,
    restore (cp:newcp):cp
  }
`;

const queries = `
  cpdMutations:cpdMutations
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
