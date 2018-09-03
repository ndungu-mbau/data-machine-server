import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newoption {
    label: String,
    value: String,
  }

  type optionMutations {
    create (option:newoption!):option,
    update (option:newoption):option,
    destroy (option:newoption):option,
    restore (option:newoption):option
  }
`;

const queries = `
  optionMutations:optionMutations
`;


const root = {
  optionMutations: () => ({
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
