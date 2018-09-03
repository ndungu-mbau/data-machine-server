const type = `
  type validation {
    addingValidation: String,
    message: String,
    regex: String,
    maxSize:String,
    types:String,
    extentions:String
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
    validations:[validation]
  }
`;

const queries = `
  question(id:String!):question,
  questions(filter:filter!):[question]
`;

const question = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'questions',
    path: ['questions', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
    options: entity[0].options ? JSON.parse(entity[0].options) : null
  });
};

const questions = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('questions')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
    options: entity[0].options ? JSON.parse(entity[0].options) : null
  }));
};

const root = {
  question,
  questions,
};

export {
  type,
  queries,
  root,
};
