import {
  create,
  update,
  destroy,
  restore,
} from './entity';

const type = `
  input newvalidation {
    addingValidation: String,
    message: String,
    regex: String,
    maxSize:String,
    types:String,
    extentions:String
  }

  input newquestion {
    id: String,
    tag: String,
    type: String,
    group:String,
    position: Float,
    placeholder: String,
    contentType: String,
    icon: String,
    options:[newoption],
    validations:[newvalidation],
    sentences:[newsentence]
  }

  type questionMutations {
    create (question:newquestion!):question,
    update (question:newquestion):question,
    destroy (question:newquestion):question,
    restore (question:newquestion):question
  }
`;

const queries = `
  questionMutations:questionMutations
`;


const root = {
  questionMutations: () => ({
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
