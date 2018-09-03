import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newsentence {
    sentenceLabel: String,
    sentenceValue: String,
  }

  type sentenceMutations {
    create (sentence:newsentence!):sentence,
    update (sentence:newsentence):sentence,
    destroy (sentence:newsentence):sentence,
    restore (sentence:newsentence):sentence
  }
`;

const queries = `
  sentenceMutations:sentenceMutations
`;


const root = {
  sentenceMutations: () => ({
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
