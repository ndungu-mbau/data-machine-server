const type = `
type constant {
  id: String,
  name: String,
  value: String
}
`;

const queries = `
  constant(id:String!):constant,
  constants(filter:filter!):[constant]
`;

const constant = () => { };

const constants = () => { };

const root = {
  constant,
  constants,
};

export { type, queries, root };
