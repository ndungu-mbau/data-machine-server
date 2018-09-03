import { create, update, destroy, restore } from './entity';

const type = `
input newcondition {
  label: String,
  value: String,
}

  input newalias {
    id: String,
    dashboard:String,
    name: String,
    prop: String,
    rangeDefault: String,
    rangeEnd: String,
    rangeStart: String,
    type: String,
    conditions:[newcondition]
  }

  type aliasMutations {
    create (alias:newalias!):alias,
    update (alias:newalias):alias,
    destroy (alias:newalias):alias,
    restore (alias:newalias):alias
  }
`;

const queries = `
  aliasMutations:aliasMutations
`;

const root = {
  aliasMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
