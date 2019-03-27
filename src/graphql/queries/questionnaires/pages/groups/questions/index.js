const type = `
  type validation {
    addingValidation: String,
    message: String,
    regex: String,
    maxSize:String,
    types:String,
    extentions:String
  }

  type conditional {
    parent:String,
    parentValue:String,
    parentValues:[String],
  }

  type question {
    id: String,
    tag: String,
    type: String,
    position: Float,
    placeholder: String,
    contentType: String,
    options:[option],
    sentences:[sentence],
    validations:[validation],
    validation:String,
    conditional:conditional
  }
`;

const queries = `
  question(id:String!):question,
  questions(filter:filter!):[question]
`;

const question = () => { };

const questions = () => { };

const root = {
  question,
  questions,
};

export {
  type,
  queries,
  root,
};
