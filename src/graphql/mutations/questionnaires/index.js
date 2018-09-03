import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newquestionnaire {
    id: String,
    name: String,
  }

  type questionnaireMutations {
    create (questionnaire:newquestionnaire!):questionnaire,
    update (questionnaire:newquestionnaire):questionnaire,
    destroy (questionnaire:newquestionnaire):questionnaire,
    restore (questionnaire:newquestionnaire):questionnaire
  }
`;

const queries = `
  questionnaireMutations:questionnaireMutations
`;


const root = {
  questionnaireMutations: () => ({
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
