const type = `
type condition {
  label: String,
  value: String,
}

  type alias {
    id: String,
    dashboard: String,
    conditions: [condition],
    name: String,
    prop: String,
    rangeDefault: String,
    rangeEnd: String,
    rangeStart: String,
    type: String,
  }
`;

const queries = `
  alias(id:String!):alias,
  aliass(filter:filter!):[alias]
`;

const alias = () => { };

const aliass = () => { };


const root = {
  alias,
  aliass,
};

export { type, queries, root };
