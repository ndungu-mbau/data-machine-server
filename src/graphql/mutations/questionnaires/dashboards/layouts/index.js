import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newlayout {
    id: String,
    name: String,
    dashboard:String
  }

  type layoutMutations {
    create (layout:newlayout!):layout,
    update (layout:newlayout):layout,
    destroy (layout:newlayout):layout,
    restore (layout:newlayout):layout
  }
`;

const queries = `
  layoutMutations:layoutMutations
`;


const root = {
  layoutMutations: () => ({
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
