import {
  create, update, destroy, restore,
} from './entity';

const type = `
  input newcpd {
    id: String,
    name: String,
    dashboard: String,
    field:String,
    formular:String,
    type:String,
    filter:String,
    filterValue:String
  }

  type cpdMutations {
    create (cpd:newcpd!):cpd,
    update (cpd:newcpd):cpd,
    destroy (cpd:newcpd):cpd,
    restore (cpd:newcpd):cp
  }
`;

const queries = `
  cpdMutations:cpdMutations
`;

const root = {
  cpdMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
