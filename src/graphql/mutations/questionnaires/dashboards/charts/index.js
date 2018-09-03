import { create, update, destroy, restore } from './entity';

const type = `
  input newcol {
    prop: String,
    label: String,
    color: String
  }

  input newchart {
    id: String,
    name: String,
    label: String,
    html: String,
    type: String,
    cols:[newcol],
    dashboard:String
  }

  type chartMutations {
    create (chart:newchart!):chart,
    update (chart:newchart):chart,
    destroy (chart:newchart):chart,
    restore (chart:newchart):chart
  }
`;

const queries = `
  chartMutations:chartMutations
`;

const root = {
  chartMutations: () => ({
    create,
    update,
    destroy,
    restore,
  }),
};

export { type, queries, root };
