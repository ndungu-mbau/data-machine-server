import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newpage {
    id: String,
    name: String,
    questionnaire:String
  }

  type pageMutations {
    create (page:newpage!):page,
    update (page:newpage):page,
    destroy (page:newpage):page,
    restore (page:newpage):page
  }
`;

const queries = `
  pageMutations:pageMutations
`;


const root = {
  pageMutations: () => ({
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
