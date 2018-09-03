const type = `
  type sentence {
    sentenceLabel: String,
    sentenceValue: String,
  }
`;

const queries = `
  sentence(id:String!):sentence,
  sentences(filter:filter!):[sentence]
`;

const sentence = async ({ id }, { datastore }) => {
  const entity = await datastore.get({
    kind: 'sentences',
    path: ['sentences', id],
    id,
  });

  return Object.assign({}, entity[0], {
    id,
  });
};

const sentences = async ({ filter }, { datastore }) => {
  const { destroyed = false, offset = 0, limit = 100 } = filter;
  const query = datastore.createQuery('sentences')
    .filter('destroyed', destroyed)
    .offset('offset', offset)
    .limit('limit', limit);
  const entities = await datastore.runQuery(query);
  return entities.shift().map(entry => Object.assign({}, entry, {
    id: entry[datastore.KEY].id,
  }));
};

const root = {
  sentence,
  sentences,
};

export {
  type,
  queries,
  root,
};
